import { Env, HttpError, json, readJson, checkOrigin, clientIp, sha256, randomHex, safeEqual, takeSlots, hex } from './util';
// @ts-ignore shared plain-JS module
import { normaliseMobile } from '../../shared/pricing.js';

// Workers permit up to 100,000 PBKDF2 iterations. Verify actual CPU time after
// deployment before accepting traffic; password changes derive two hashes.
const ITERATIONS = 100000;
const SESSION_SECONDS = 7 * 86400;
const COOKIE = 'trio_customer';
const TOKEN = /^[a-f0-9]{64}$/;
const DUMMY_SALT = 'b17c9c74e2ba74975433898071bb7bea';
const encoder = new TextEncoder();
type Customer = { id: string; name: string; email: string; mobile: string };
type Account = Customer & { password_hash: string; salt: string; iterations: number; generation: number };
type SessionCustomer = Customer & { generation: number };

async function passwordHash(password: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g)!.map((pair) => parseInt(pair, 16)));
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

function cookieToken(request: Request): string {
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === COOKIE) return value.join('=');
  }
  return '';
}
const sessionCookie = (token: string, maxAge: number) => `${COOKIE}=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const publicCustomer = (row: Customer): Customer => ({ id: row.id, name: row.name, email: row.email, mobile: row.mobile });
const strongEnough = (value: unknown): value is string => typeof value === 'string' && value.length >= 16 && value.length <= 200;

function emailValue(value: unknown): string {
  if (typeof value !== 'string') throw new HttpError(400, 'bad-email');
  const email = value.trim().toLowerCase();
  const local = email.slice(0, email.indexOf('@'));
  if (email.length > 254 || local.length > 64 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(email) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) throw new HttpError(400, 'bad-email');
  return email;
}
function nameValue(value: unknown): string {
  if (typeof value !== 'string') throw new HttpError(400, 'bad-name');
  const name = value.trim();
  const length = Array.from(name).length;
  if (length < 2 || length > 80 || /[\u0000-\u001f\u007f]/.test(name)) throw new HttpError(400, 'bad-name');
  return name;
}
function mobileValue(value: unknown): string {
  if (typeof value !== 'string' || value.length > 40) throw new HttpError(400, 'bad-mobile');
  if (!value.trim()) return '';
  const mobile = normaliseMobile(value);
  if (!mobile) throw new HttpError(400, 'bad-mobile');
  return mobile;
}

async function authSlots(request: Request, env: Env, kind: string, max: number, window: number): Promise<void> {
  const ip = await sha256(`trio-customer:${clientIp(request)}`);
  // The login prefix makes the shared limiter return the translated locked code.
  await takeSlots(env, [[`login:customer:${kind}:${ip}`, max, window]]);
}

async function session(request: Request, env: Env): Promise<SessionCustomer | null> {
  const token = cookieToken(request);
  if (!TOKEN.test(token)) return null;
  return env.DB.prepare('SELECT c.id, c.name, c.email, c.mobile, c.generation FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = ? AND s.expires_at > ? AND s.generation = c.generation')
    .bind(await sha256(token), Math.floor(Date.now() / 1000)).first<SessionCustomer>();
}

// Order ownership comes exclusively from this verified session, never a body id.
export async function customerId(request: Request, env: Env): Promise<string | null> {
  return (await session(request, env))?.id || null;
}
async function requiredCustomer(request: Request, env: Env): Promise<SessionCustomer> {
  const customer = await session(request, env);
  if (!customer) throw new HttpError(401, 'signed-out');
  return customer;
}

async function newSession(request: Request, env: Env, customer: { id: string; generation: number }): Promise<string> {
  const token = randomHex(32);
  const now = Math.floor(Date.now() / 1000);
  const previous = cookieToken(request);
  const statements = [env.DB.prepare('DELETE FROM customer_sessions WHERE expires_at <= ?').bind(now)];
  if (TOKEN.test(previous)) statements.push(env.DB.prepare('DELETE FROM customer_sessions WHERE token_hash = ?').bind(await sha256(previous)));
  // Checking the credential generation in the insert prevents an old password
  // verification from opening a session after a concurrent password change.
  statements.push(env.DB.prepare('INSERT INTO customer_sessions (token_hash, customer_id, generation, expires_at) SELECT ?, id, generation, ? FROM customers WHERE id = ? AND generation = ?')
    .bind(await sha256(token), now + SESSION_SECONDS, customer.id, customer.generation));
  const results = await env.DB.batch(statements);
  if (!results[results.length - 1].meta.changes) throw new HttpError(403, 'bad-credentials');
  return token;
}

async function ownOrders(env: Env, customer: Customer, url: URL): Promise<Response> {
  const cursor = url.searchParams.get('before');
  if (cursor !== null && (!/^[1-9]\d{0,15}$/.test(cursor) || !Number.isSafeInteger(Number(cursor)))) throw new HttpError(400, 'bad-cursor');
  const before = cursor === null ? Number.MAX_SAFE_INTEGER : Number(cursor);
  const results = await env.DB.batch([
    env.DB.prepare('SELECT number, seq, created_at, status, fulfilment, total_fils FROM orders WHERE customer_id = ? AND seq < ? ORDER BY seq DESC LIMIT 51').bind(customer.id, before),
    env.DB.prepare('SELECT l.* FROM order_lines l JOIN (SELECT number FROM orders WHERE customer_id = ? AND seq < ? ORDER BY seq DESC LIMIT 50) o ON o.number = l.order_number ORDER BY l.order_number, l.position').bind(customer.id, before),
  ]);
  const rows = (results[0].results || []) as Array<{ number: string; seq: number; created_at: string; status: string; fulfilment: string; total_fils: number }>;
  const lines = new Map<string, unknown[]>();
  for (const row of (results[1].results || []) as Array<any>) {
    if (!lines.has(row.order_number)) lines.set(row.order_number, []);
    lines.get(row.order_number)!.push({ id: row.variant_id, name: row.name, nameAr: row.name_ar, storage: row.storage, condition: row.condition, qty: row.qty, unitFils: row.unit_fils });
  }
  const page = rows.slice(0, 50);
  return json({ orders: page.map((row) => ({ number: row.number, createdAt: row.created_at, status: row.status, fulfilment: row.fulfilment, totalFils: row.total_fils, lines: lines.get(row.number) || [] })), nextBefore: rows.length > 50 ? page[page.length - 1].seq : null });
}

export async function handleCustomer(request: Request, env: Env, url: URL, path: string): Promise<Response> {
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') checkOrigin(request);

  if (path === 'session' && method === 'GET') {
    const customer = await session(request, env);
    return json({ configured: true, signedIn: !!customer, customer: customer ? publicCustomer(customer) : null });
  }

  if (path === 'register' && method === 'POST') {
    const body = await readJson(request, 4096);
    await authSlots(request, env, 'register', 10, 3600);
    const name = nameValue(body.name);
    const email = emailValue(body.email);
    if (!strongEnough(body.password)) throw new HttpError(400, 'weak-password');
    const mobile = body.mobile === undefined ? '' : mobileValue(body.mobile);
    const salt = randomHex(16);
    const hash = await passwordHash(body.password, salt, ITERATIONS);
    const customer = { id: randomHex(16), name, email, mobile };
    const token = randomHex(32);
    const now = Math.floor(Date.now() / 1000);
    const stamp = new Date().toISOString();
    const results = await env.DB.batch([
      env.DB.prepare('INSERT INTO customers (id, email, name, mobile, password_hash, salt, iterations, generation, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?) ON CONFLICT(email) DO NOTHING')
        .bind(customer.id, email, name, mobile, hash, salt, ITERATIONS, stamp, stamp),
      env.DB.prepare('INSERT INTO customer_sessions (token_hash, customer_id, generation, expires_at) SELECT ?, id, generation, ? FROM customers WHERE id = ?').bind(await sha256(token), now + SESSION_SECONDS, customer.id),
    ]);
    if (!results[0].meta.changes) throw new HttpError(409, 'email-in-use');
    return json({ ok: true, customer }, 201, { 'Set-Cookie': sessionCookie(token, SESSION_SECONDS) });
  }

  if (path === 'login' && method === 'POST') {
    const body = await readJson(request, 4096);
    await authSlots(request, env, 'login', 10, 900);
    let email = '';
    try { email = emailValue(body.email); } catch { /* Same response and password work for invalid or unknown emails. */ }
    const account = email ? await env.DB.prepare('SELECT id, name, email, mobile, password_hash, salt, iterations, generation FROM customers WHERE email = ?').bind(email).first<Account>() : null;
    const validPassword = typeof body.password === 'string' && body.password.length <= 200;
    const given = validPassword ? body.password : '';
    const hash = await passwordHash(given, account?.salt || DUMMY_SALT, account?.iterations || ITERATIONS);
    if (!account || !validPassword || !safeEqual(hash, account.password_hash)) throw new HttpError(403, 'bad-credentials');
    const token = await newSession(request, env, account);
    return json({ ok: true, customer: publicCustomer(account) }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_SECONDS) });
  }

  if (path === 'logout' && method === 'POST') {
    await readJson(request, 1024);
    const token = cookieToken(request);
    if (TOKEN.test(token)) await env.DB.prepare('DELETE FROM customer_sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
  }

  const customer = await requiredCustomer(request, env);
  if (path === 'profile' && method === 'GET') return json({ customer: publicCustomer(customer) });
  if (path === 'orders' && method === 'GET') return ownOrders(env, customer, url);

  if (path === 'profile' && method === 'PATCH') {
    const body = await readJson(request, 2048);
    await authSlots(request, env, 'profile', 30, 900);
    if (body.name === undefined && body.mobile === undefined) throw new HttpError(400, 'nothing-to-change');
    const name = body.name === undefined ? customer.name : nameValue(body.name);
    const mobile = body.mobile === undefined ? customer.mobile : mobileValue(body.mobile);
    await env.DB.prepare('UPDATE customers SET name = ?, mobile = ?, updated_at = ? WHERE id = ?').bind(name, mobile, new Date().toISOString(), customer.id).run();
    return json({ customer: { ...publicCustomer(customer), name, mobile } });
  }

  if (path === 'password' && method === 'POST') {
    const body = await readJson(request, 4096);
    await authSlots(request, env, 'password', 5, 900);
    if (!strongEnough(body.password)) throw new HttpError(400, 'weak-password');
    const account = await env.DB.prepare('SELECT id, name, email, mobile, password_hash, salt, iterations, generation FROM customers WHERE id = ?').bind(customer.id).first<Account>();
    if (!account) throw new HttpError(401, 'signed-out');
    const validCurrent = typeof body.current === 'string' && body.current.length <= 200;
    const current = await passwordHash(validCurrent ? body.current : '', account.salt, account.iterations);
    if (!validCurrent || !safeEqual(current, account.password_hash)) throw new HttpError(403, 'bad-credentials');
    const salt = randomHex(16);
    const hash = await passwordHash(body.password, salt, ITERATIONS);
    const token = randomHex(32);
    const generation = account.generation + 1;
    const results = await env.DB.batch([
      env.DB.prepare('UPDATE customers SET password_hash = ?, salt = ?, iterations = ?, generation = ?, updated_at = ? WHERE id = ? AND generation = ? AND password_hash = ?')
        .bind(hash, salt, ITERATIONS, generation, new Date().toISOString(), customer.id, account.generation, account.password_hash),
      env.DB.prepare('DELETE FROM customer_sessions WHERE customer_id = ? AND generation < (SELECT generation FROM customers WHERE id = ?)').bind(customer.id, customer.id),
      env.DB.prepare('INSERT INTO customer_sessions (token_hash, customer_id, generation, expires_at) SELECT ?, id, generation, ? FROM customers WHERE id = ? AND generation = ? AND password_hash = ?')
        .bind(await sha256(token), Math.floor(Date.now() / 1000) + SESSION_SECONDS, customer.id, generation, hash),
    ]);
    if (!results[0].meta.changes || !results[2].meta.changes) throw new HttpError(403, 'bad-credentials');
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_SECONDS) });
  }

  throw new HttpError(404, 'not-found');
}
