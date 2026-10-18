import { Env, HttpError, json, readJson, checkOrigin, clientIp, sha256, takeSlots, str } from './util';
import { getContent } from './content';
import { customerId } from './customer';
// @ts-ignore shared plain-JS modules
import { priceLines, normaliseMobile, formatJD } from '../../shared/pricing.js';
// @ts-ignore
import { governorates, conditions } from '../../shared/labels.js';

const TOKEN = /^[a-f0-9]{32}$/;

async function findByToken(env: Env, token: string) {
  return env.DB.prepare('SELECT number, total_fils FROM orders WHERE token = ?').bind(token).first<{ number: string; total_fils: number }>();
}

export async function placeOrder(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  checkOrigin(request);
  const body = await readJson(request, 16 * 1024);
  const { content } = await getContent(env, { fresh: true });
  if (content.settings?.ordersOn !== true) throw new HttpError(403, 'orders-off');
  if (str(body.website, 200)) throw new HttpError(400, 'bad-request'); // honeypot
  if (!(Number(body.elapsedMs) >= 3000)) throw new HttpError(400, 'too-fast');
  const token = String(body.token || '');
  if (!TOKEN.test(token)) throw new HttpError(400, 'bad-token');

  const existing = await findByToken(env, token);
  if (existing) return json({ number: existing.number, totalFils: existing.total_fils });

  const priced = priceLines(content, body.lines);
  if (!priced.ok) throw new HttpError(priced.error === 'sold-out' || priced.error === 'unknown' ? 409 : 400, priced.error, priced.id ? { id: priced.id } : {});
  if (!Number.isInteger(body.totalFils) || body.totalFils !== priced.totalFils) throw new HttpError(409, 'price-changed');

  const c = body.customer || {};
  const name = str(c.name, 60);
  if (name.length < 2) throw new HttpError(400, 'bad-name');
  const mobile = normaliseMobile(c.mobile);
  if (!mobile) throw new HttpError(400, 'bad-mobile');
  if (!['pickup', 'delivery'].includes(body.fulfilment)) throw new HttpError(400, 'bad-fulfilment');
  const fulfilment = body.fulfilment;
  let governorate = '';
  let address = '';
  if (fulfilment === 'delivery') {
    governorate = str(c.governorate, 20);
    if (!governorates.some(([id]: [string]) => id === governorate)) throw new HttpError(400, 'bad-governorate');
    address = str(c.address, 200);
    if (address.length < 4) throw new HttpError(400, 'bad-address');
  }
  const notes = str(c.notes, 300);
  const lang = body.lang === 'en' ? 'en' : 'ar';
  const owner = await customerId(request, env);

  const ipKey = await sha256(`trio-order:${clientIp(request)}`);
  await takeSlots(env, [[`order:${ipKey}`, 10, 3600], ['order:*', 300, 3600]]);

  const createdAt = new Date().toISOString();
  const db = env.DB;
  const statements = [
    db.prepare("UPDATE counters SET value = value + 1 WHERE name = 'order'"),
    db.prepare("INSERT INTO orders (number, seq, token, created_at, status, name, mobile, governorate, address, notes, fulfilment, lang, total_fils, customer_id) SELECT 'T-' || value, value, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ? FROM counters WHERE name = 'order'")
      .bind(token, createdAt, name, mobile, governorate, address, notes, fulfilment, lang, priced.totalFils, owner),
    ...priced.lines.map((line: any, position: number) => db.prepare("INSERT INTO order_lines (order_number, position, variant_id, name, name_ar, storage, condition, qty, unit_fils) SELECT 'T-' || value, ?, ?, ?, ?, ?, ?, ?, ? FROM counters WHERE name = 'order'")
      .bind(position, line.id, line.product.name.en, line.product.name.ar, line.variant.storage || '', line.variant.condition || '', line.qty, line.unitFils)),
    db.prepare('SELECT number FROM orders WHERE token = ?').bind(token),
  ];
  let number: string;
  try {
    const results = await db.batch(statements);
    number = (results[results.length - 1].results?.[0] as any)?.number;
  } catch (error) {
    // A resend racing the first request hits the unique token: return the first order.
    const again = await findByToken(env, token);
    if (again) return json({ number: again.number, totalFils: again.total_fils });
    throw error;
  }
  if (!number) throw new HttpError(500, 'server');

  if (env.RESEND_API_KEY && env.ORDER_EMAIL) {
    ctx.waitUntil(sendOrderEmail(env, { number, createdAt, name, mobile, governorate, address, notes, fulfilment, lines: priced.lines, totalFils: priced.totalFils }).catch((e) => console.error('email', e)));
  }
  return json({ number, totalFils: priced.totalFils }, 201);
}

const escHtml = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));

async function sendOrderEmail(env: Env, o: any) {
  const gov = governorates.find(([id]: [string]) => id === o.governorate);
  const rows = o.lines.map((l: any) => `<tr><td style="padding:8px;border-bottom:1px solid #2a2f25">${escHtml(l.product.name.ar)}${l.variant.storage ? ` · ${escHtml(l.variant.storage)}` : ''}${l.variant.condition ? ` · ${escHtml(conditions[l.variant.condition]?.ar || '')}` : ''}</td><td style="padding:8px;border-bottom:1px solid #2a2f25">× ${l.qty}</td><td style="padding:8px;border-bottom:1px solid #2a2f25;white-space:nowrap">${escHtml(formatJD(l.totalFils, 'ar'))}</td></tr>`).join('');
  const html = `<div dir="rtl" style="background:#121410;color:#f4f5ef;font-family:Arial,sans-serif;padding:24px"><h1 style="color:#70f336;margin:0 0 8px">طلب جديد ${escHtml(o.number)}</h1><p style="margin:0 0 16px;color:#a4ad9b">${escHtml(o.createdAt)}</p><p style="margin:0">${escHtml(o.name)} · <span dir="ltr">${escHtml(o.mobile)}</span></p><p style="margin:4px 0 16px">${o.fulfilment === 'pickup' ? 'استلام من المحل' : `توصيل: ${escHtml(gov ? gov[1] : '')} — ${escHtml(o.address)}`}</p>${o.notes ? `<p style="margin:0 0 16px">ملاحظات: ${escHtml(o.notes)}</p>` : ''}<table style="border-collapse:collapse;width:100%;color:#f4f5ef">${rows}</table><p style="font-size:18px;margin:16px 0 0">المجموع: <strong style="color:#70f336">${escHtml(formatJD(o.totalFils, 'ar'))}</strong></p></div>`;
  const text = [`طلب جديد ${o.number}`, `${o.name} — ${o.mobile}`, o.fulfilment === 'pickup' ? 'استلام من المحل' : `توصيل: ${gov ? gov[1] : ''} — ${o.address}`, o.notes ? `ملاحظات: ${o.notes}` : '', ...o.lines.map((l: any) => `- ${l.product.name.ar} ${l.variant.storage || ''} × ${l.qty} = ${formatJD(l.totalFils, 'ar')}`), `المجموع: ${formatJD(o.totalFils, 'ar')}`].filter(Boolean).join('\n');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `order-${o.number}` },
      body: JSON.stringify({ from: env.ORDER_FROM || 'TRIO Mobile <onboarding@resend.dev>', to: [env.ORDER_EMAIL], subject: `طلب جديد ${o.number} — ${formatJD(o.totalFils, 'ar')}`, html, text }),
    });
    if (!res.ok) console.error('email status', res.status, (await res.text()).slice(0, 300));
  } finally { clearTimeout(timer); }
}

export async function listOrders(env: Env, url: URL): Promise<Response> {
  const status = url.searchParams.get('status') || '';
  if (status && !STATUSES.includes(status)) throw new HttpError(400, 'bad-status');
  const before = url.searchParams.get('before');
  if (before && (!/^\d{1,15}$/.test(before) || Number(before) < 1)) throw new HttpError(400, 'bad-cursor');
  const filters: string[] = []; const values: unknown[] = [];
  if (status) { filters.push('status = ?'); values.push(status); }
  if (before) { filters.push('seq < ?'); values.push(Number(before)); }
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
  // One transactional snapshot keeps headers and lines on the same page while
  // new orders arrive concurrently.
  const [rows, lineRows] = await env.DB.batch([
    env.DB.prepare(`SELECT * FROM orders${where} ORDER BY seq DESC LIMIT 300`).bind(...values),
    env.DB.prepare(`SELECT l.* FROM order_lines l JOIN (SELECT number FROM orders${where} ORDER BY seq DESC LIMIT 300) o ON o.number = l.order_number ORDER BY l.order_number, l.position`).bind(...values),
  ]);
  const orders = (rows.results || []) as any[];
  const lines = (lineRows.results || []) as any[];
  const byOrder = new Map<string, any[]>();
  for (const l of lines) { if (!byOrder.has(l.order_number)) byOrder.set(l.order_number, []); byOrder.get(l.order_number)!.push({ id: l.variant_id, name: l.name, nameAr: l.name_ar, storage: l.storage, condition: l.condition, qty: l.qty, unitFils: l.unit_fils }); }
  return json({ orders: orders.map((o: any) => ({ number: o.number, createdAt: o.created_at, status: o.status, note: o.note, fulfilment: o.fulfilment, lang: o.lang, totalFils: o.total_fils, customer: { name: o.name, mobile: o.mobile, governorate: o.governorate, address: o.address, notes: o.notes }, lines: byOrder.get(o.number) || [] })), nextBefore: orders.length === 300 ? orders[orders.length - 1].seq : null });
}

const STATUSES = ['new', 'confirmed', 'out', 'delivered', 'cancelled'];
export async function updateOrder(request: Request, env: Env, number: string): Promise<Response> {
  const body = await readJson(request, 4096);
  const sets: string[] = []; const values: unknown[] = [];
  if (body.status !== undefined) { if (!STATUSES.includes(body.status)) throw new HttpError(400, 'bad-status'); sets.push('status = ?'); values.push(body.status); }
  if (body.note !== undefined) { if (typeof body.note !== 'string') throw new HttpError(400, 'bad-note'); sets.push('note = ?'); values.push(body.note.slice(0, 500)); }
  if (!sets.length) throw new HttpError(400, 'nothing-to-change');
  const res = await env.DB.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE number = ?`).bind(...values, number).run();
  if (!res.meta.changes) throw new HttpError(404, 'not-found');
  return json({ ok: true });
}
