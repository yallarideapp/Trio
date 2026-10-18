import { Env, HttpError, json, fail } from './util';
import { getContent, publicCopy } from './content';
import { placeOrder } from './orders';
import { handleAdmin } from './admin';
import { handleCustomer } from './customer';

const PHOTO = /^\/api\/photo\/([a-f0-9]{32})$/;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new HttpError(403, 'https-only');
      const path = url.pathname;
      if (path.startsWith('/api/customer/')) return await handleCustomer(request, env, url, path.slice('/api/customer/'.length));
      if (path === '/api/content' && request.method === 'GET') {
        const { version, content, fromSeed } = await getContent(env);
        if (fromSeed) return json({ error: 'not-published' }, 404);
        return json({ version, content: publicCopy(content) }, 200, { 'Cache-Control': 'no-cache' });
      }
      if (path === '/api/order' && request.method === 'POST') return await placeOrder(request, env, ctx);
      const photo = path.match(PHOTO);
      if (photo && request.method === 'GET') {
        // Photos never change under the same id, so keep them in the edge cache to spare KV reads.
        const cache = (caches as any).default as Cache;
        const key = new Request(url.toString(), { method: 'GET' });
        const hit = await cache.match(key);
        if (hit) return hit;
        const value = await env.PHOTOS.get(`photo:${photo[1]}`, 'arrayBuffer');
        if (!value) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
        const response = new Response(value, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } });
        ctx.waitUntil(cache.put(key, response.clone()));
        return response;
      }
      if (path.startsWith('/api/admin/')) return await handleAdmin(request, env, url, path.slice('/api/admin/'.length));
      throw new HttpError(404, 'not-found');
    } catch (error) {
      return fail(error);
    }
  },
} satisfies ExportedHandler<Env>;
