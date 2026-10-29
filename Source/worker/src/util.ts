export interface Env {
  DB: D1Database;
  PHOTOS: KVNamespace;
  ASSETS: Fetcher;
  SETUP_CODE?: string;
  RESEND_API_KEY?: string;
  ORDER_EMAIL?: string;
  ORDER_FROM?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, public extra: Record<string, unknown> = {}) { super(code); }
}

const baseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
};

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  // Escape <, > and & so a value can never be read as markup.
  const body = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return new Response(body, { status, headers: { ...baseHeaders, ...headers } });
}

export function fail(error: unknown): Response {
  if (error instanceof HttpError) return json({ error: error.code, ...error.extra }, error.status);
  console.error('unhandled', error instanceof Error ? error.stack || error.message : error);
  return json({ error: 'server' }, 500);
}

// Same-site requests only for anything that changes data.
export function checkOrigin(request: Request): void {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin) {
    if (origin !== url.origin) throw new HttpError(403, 'bad-origin');
    return;
  }
  if (request.headers.get('Sec-Fetch-Site') !== 'same-origin') throw new HttpError(403, 'bad-origin');
}

// Reads the body as a stream and stops as soon as it passes the cap, so a request
// without Content-Length can't make the Worker buffer a huge body.
async function readCapped(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(request.headers.get('Content-Length') || '0');
  if (declared > maxBytes) throw new HttpError(413, 'too-large');
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { reader.releaseLock(); throw new HttpError(413, 'too-large'); }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.byteLength; }
  return out;
}

export async function readJson(request: Request, maxBytes: number): Promise<any> {
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw new HttpError(415, 'bad-type');
  const bytes = await readCapped(request, maxBytes);
  let value: any;
  try { value = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new HttpError(400, 'bad-json'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'bad-json');
  return value;
}

export async function readBytes(request: Request, maxBytes: number): Promise<Uint8Array> {
  return readCapped(request, maxBytes);
}

const encoder = new TextEncoder();
export const hex = (buffer: ArrayBuffer | Uint8Array) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
export async function sha256(text: string): Promise<string> { return hex(await crypto.subtle.digest('SHA-256', encoder.encode(text))); }
export function randomHex(bytes: number): string { const a = new Uint8Array(bytes); crypto.getRandomValues(a); return hex(a); }

export function safeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a); const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export function clientIp(request: Request): string {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  if (!ip.includes(':')) return ip;
  // Group IPv6 addresses by their /48 so one household can't rotate around limits.
  const [head, tail = ''] = ip.split('::');
  const a = head ? head.split(':') : [];
  const b = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : a;
  return groups.slice(0, 3).map((g) => (parseInt(g, 16) || 0).toString(16)).join(':') + '::/48';
}

const now = () => Math.floor(Date.now() / 1000);

// Takes one slot for each key, atomically: the row is only added while the key is
// under its limit, so requests sent in parallel can't all slip through.
export async function takeSlots(env: Env, checks: Array<[string, number, number]>): Promise<void> {
  const t = now();
  for (const [key, max, windowSec] of checks) {
    const res = await env.DB.prepare('INSERT INTO attempts (key, at) SELECT ?1, ?2 WHERE (SELECT COUNT(*) FROM attempts WHERE key = ?1 AND at > ?3) < ?4').bind(key, t, t - windowSec, max).run();
    if (!res.meta.changes) throw new HttpError(429, key.startsWith('login') || key.startsWith('setup') ? 'locked' : 'rate-limited');
  }
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM attempts WHERE at < ?').bind(t - 86400).run();
}

export async function clearSlots(env: Env, key: string): Promise<void> {
  await env.DB.prepare('DELETE FROM attempts WHERE key = ?').bind(key).run();
}

export const str = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');
export const isStr = (value: unknown): value is string => typeof value === 'string';
