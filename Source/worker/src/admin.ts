import { Env, HttpError, json, readJson, readBytes, checkOrigin, clientIp, sha256, randomHex, safeEqual, takeSlots, clearSlots, hex } from './util';
import { getContent, sanitizeContent, dropCache } from './content';
import { listOrders, updateOrder } from './orders';

// 20,000 rounds keep a sign-in (and a password change, which hashes twice) inside the
// free plan's 10 ms of CPU. The 16-character minimum makes up for the lower count.
// Hashes saved with another count still verify: each row keeps its own count.
const ITERATIONS = 20000;
const SESSION_SECONDS = 12 * 3600;
const COOKIE = 'trio_admin';

async function pbkdf2(password: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g)!.map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return hex(bits);
}

function cookieFrom(request: Request): string {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return '';
}
function sessionCookie(token: string, maxAge: number) {
  return `${COOKIE}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

async function adminRow(env: Env) {
  return env.DB.prepare('SELECT password_hash, salt, iterations, generation FROM admin WHERE id = 1').first<{ password_hash: string; salt: string; iterations: number; generation: number }>();
}

async function session(request: Request, env: Env): Promise<boolean> {
  const token = cookieFrom(request);
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const row = await env.DB.prepare('SELECT s.expires_at, s.generation, a.generation AS current FROM sessions s JOIN admin a ON a.id = 1 WHERE s.token_hash = ?').bind(await sha256(token)).first<{ expires_at: number; generation: number; current: number }>();
  return !!row && row.expires_at > Date.now() / 1000 && row.generation === row.current;
}

async function newSession(env: Env, generation: number): Promise<string> {
  const token = randomHex(32);
  const t = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(t),
    env.DB.prepare('INSERT INTO sessions (token_hash, generation, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), generation, t + SESSION_SECONDS),
  ]);
  return token;
}

const strongEnough = (p: unknown): p is string => typeof p === 'string' && p.length >= 16 && p.length <= 200;

// Five wrong tries per IP per 15 minutes. The slot is taken before any password
// work and given back on success. There is no shop-wide lock, so other people's
// wrong guesses can never keep the owner out.
async function attemptKey(request: Request, kind: string) {
  return `${kind}:${await sha256(`trio-${kind}:${clientIp(request)}`)}`;
}

export async function handleAdmin(request: Request, env: Env, url: URL, path: string): Promise<Response> {
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') checkOrigin(request);

  if (path === 'status' && method === 'GET') {
    const row = await adminRow(env);
    return json({ setup: !!row, signedIn: row ? await session(request, env) : false });
  }

  if (path === 'setup' && method === 'POST') {
    const body = await readJson(request, 2048);
    const setupCode = (env.SETUP_CODE || '').trim();
    if (setupCode.length < 8) throw new HttpError(503, 'not-configured');
    if (await adminRow(env)) throw new HttpError(409, 'already-setup');
    const key = await attemptKey(request, 'setup');
    await takeSlots(env, [[key, 5, 900]]);
    if (typeof body.code !== 'string' || !safeEqual(body.code.trim(), setupCode)) throw new HttpError(403, 'bad-code');
    await clearSlots(env, key);
    if (!strongEnough(body.password)) throw new HttpError(400, 'weak-password');
    const salt = randomHex(16);
    const hash = await pbkdf2(body.password, salt, ITERATIONS);
    const res = await env.DB.prepare('INSERT OR IGNORE INTO admin (id, password_hash, salt, iterations, generation, updated_at) VALUES (1, ?, ?, ?, 1, ?)').bind(hash, salt, ITERATIONS, new Date().toISOString()).run();
    if (!res.meta.changes) throw new HttpError(409, 'already-setup');
    const token = await newSession(env, 1);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_SECONDS) });
  }

  if (path === 'login' && method === 'POST') {
    const body = await readJson(request, 2048);
    const row = await adminRow(env);
    if (!row) throw new HttpError(409, 'not-setup');
    const key = await attemptKey(request, 'login');
    await takeSlots(env, [[key, 5, 900]]);
    const given = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
    const hash = await pbkdf2(given, row.salt, row.iterations);
    if (!safeEqual(hash, row.password_hash)) throw new HttpError(403, 'bad-password');
    await clearSlots(env, key);
    const token = await newSession(env, row.generation);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_SECONDS) });
  }

  if (path === 'logout' && method === 'POST') {
    const token = cookieFrom(request);
    if (/^[a-f0-9]{64}$/.test(token)) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
  }

  // Everything below needs a signed-in admin.
  if (!(await session(request, env))) throw new HttpError(401, 'signed-out');

  if (path === 'password' && method === 'POST') {
    const body = await readJson(request, 2048);
    const row = (await adminRow(env))!;
    const key = await attemptKey(request, 'login');
    await takeSlots(env, [[key, 5, 900]]);
    const current = await pbkdf2(typeof body.current === 'string' ? body.current.slice(0, 200) : '', row.salt, row.iterations);
    if (!safeEqual(current, row.password_hash)) throw new HttpError(403, 'bad-password');
    await clearSlots(env, key);
    if (!strongEnough(body.password)) throw new HttpError(400, 'weak-password');
    const salt = randomHex(16);
    const hash = await pbkdf2(body.password, salt, ITERATIONS);
    const generation = row.generation + 1;
    await env.DB.batch([
      env.DB.prepare('UPDATE admin SET password_hash = ?, salt = ?, iterations = ?, generation = ?, updated_at = ? WHERE id = 1').bind(hash, salt, ITERATIONS, generation, new Date().toISOString()),
      env.DB.prepare('DELETE FROM sessions'),
    ]);
    const token = await newSession(env, generation);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_SECONDS) });
  }

  if (path === 'content' && method === 'GET') {
    const { version, content } = await getContent(env, { fresh: true });
    return json({ version, content });
  }

  if (path === 'content' && method === 'PUT') {
    const body = await readJson(request, 600 * 1024);
    if (!Number.isInteger(body.baseVersion)) throw new HttpError(400, 'bad-version');
    const clean = sanitizeContent(body.content);
    const current = await getContent(env, { fresh: true });
    if (body.baseVersion !== current.version) throw new HttpError(409, 'conflict', { version: current.version });
    const version = current.version + 1;
    const text = JSON.stringify({ ...clean, version });
    const stmt = current.fromSeed
      ? env.DB.prepare('INSERT INTO content (id, version, body, updated_at) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(version, text, new Date().toISOString())
      : env.DB.prepare('UPDATE content SET version = ?, body = ?, updated_at = ? WHERE id = 1 AND version = ?').bind(version, text, new Date().toISOString(), current.version);
    const res = await stmt.run();
    dropCache();
    if (!res.meta.changes) throw new HttpError(409, 'conflict');
    return json({ ok: true, version });
  }

  if (path === 'photo' && method === 'POST') {
    const type = (request.headers.get('Content-Type') || '').split(';')[0].trim();
    if (type !== 'image/webp') throw new HttpError(415, 'bad-type');
    const bytes = await readBytes(request, 1024 * 1024);
    const sig = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
    if (bytes.length < 16 || sig(0, 4) !== 'RIFF' || sig(8, 12) !== 'WEBP') throw new HttpError(400, 'not-webp');
    const id = randomHex(16);
    await env.PHOTOS.put(`photo:${id}`, bytes, { metadata: { type: 'image/webp', at: Date.now() } });
    return json({ id }, 201);
  }

  if (path === 'orders' && method === 'GET') return listOrders(env, url);
  const m = path.match(/^orders\/(T-\d{1,9})$/);
  if (m && method === 'PATCH') return updateOrder(request, env, m[1]);

  throw new HttpError(404, 'not-found');
}
