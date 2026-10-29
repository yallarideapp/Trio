// Builds the site.
//   node tools/build.mjs live           -> dist/  (served by the Cloudflare Worker)
//   node tools/build.mjs demo [outDir]  -> ../Demo/ (portable copy, opens from a folder)
//   node tools/build.mjs pages         -> ../website/ (catalog + browser-only editor)
import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile, stat, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '..');
const project = path.resolve(source, '..');
const mode = process.argv[2] || 'live';
if (!['live', 'demo', 'pages'].includes(mode)) throw new Error(`Unknown build mode: ${mode}`);
const outputRoot = mode === 'demo' ? path.join(project, 'Demo') : mode === 'pages' ? path.join(project, 'website') : path.join(source, 'dist');
const out = path.resolve(process.argv[3] || outputRoot);
// The public URL belongs to the deployment, rather than a GitHub owner.
// Omit the optional share image until that deployment has a public URL.
let socialImage = '';
if (process.env.SITE_URL?.trim()) {
  const url = new URL(process.env.SITE_URL.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS website URL without credentials, query or fragment');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  const image = new URL('assets/devices/iphone-17-pro-max.webp', url).href.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  socialImage = `<meta property="og:image" content="${image}">`;
}

const inside = (dir, root) => { const rel = path.relative(root, dir); return rel && !rel.startsWith('..') && !path.isAbsolute(rel); };
if (out !== outputRoot && !inside(out, outputRoot)) throw new Error(`Build output must stay within ${outputRoot}: ${out}`);
// Never follow a redirected output directory when removing the previous build.
let check = project;
for (const part of path.relative(project, out).split(path.sep)) {
  check = path.join(check, part);
  try {
    if ((await lstat(check)).isSymbolicLink()) throw new Error(`Refusing symlinked build output: ${check}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 12);
await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'admin'), { recursive: true });

const common = { bundle: true, format: 'iife', target: ['es2020', 'safari15'], minify: true, legalComments: 'none', define: { __MODE__: JSON.stringify(mode) }, logLevel: 'warning' };
await build({ ...common, entryPoints: [path.join(source, 'site/src/app.js')], outfile: path.join(out, 'app.js') });
await build({ ...common, entryPoints: [path.join(source, 'site/admin/src/admin.js')], outfile: path.join(out, 'admin/admin.js') });

const htmlFiles = [['site/index.html', 'index.html'], ['site/admin/index.html', 'admin/index.html']];
for (const [from, to] of htmlFiles) {
  let html = (await readFile(path.join(source, from), 'utf8')).replaceAll('__BUILD__', stamp).replace('<!-- __SOCIAL_IMAGE__ -->', socialImage);
  if (mode === 'demo') html = html.replace(/\s*<link rel="preload"[^>]*>/g, '');
  await writeFile(path.join(out, to), html);
}
// A page opened straight from a folder (file://) may not load font files, so the
// demo carries its fonts inside the stylesheets.
async function css(from, to) {
  let text = await readFile(path.join(source, from), 'utf8');
  if (mode === 'demo') {
    const fonts = [...new Set([...text.matchAll(/url\('([^')]+\.woff2)'\)/g)].map((m) => m[1]))];
    for (const ref of fonts) {
      const data = await readFile(path.resolve(path.dirname(path.join(source, from)), ref));
      text = text.replaceAll(`url('${ref}')`, `url('data:font/woff2;base64,${data.toString('base64')}')`);
    }
  }
  await writeFile(path.join(out, to), text);
}
await css('site/styles.css', 'styles.css');
await css('site/admin/admin.css', 'admin/admin.css');
await cp(path.join(source, 'site/assets'), path.join(out, 'assets'), { recursive: true });

if (mode === 'pages') {
  await writeFile(path.join(out, '.nojekyll'), '');
  await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /admin/\n');
}

if (mode === 'live') {
  // Google is allowed so measurement can load after the visitor agrees (it never loads before).
  const csp = "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self'; img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com https://*.google.jo; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com https://*.google.jo https://pagead2.googlesyndication.com; frame-src https://td.doubleclick.net https://www.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
  await writeFile(path.join(out, '_headers'), [
    '/*', `  Content-Security-Policy: ${csp}`, '  X-Content-Type-Options: nosniff', '  Referrer-Policy: strict-origin-when-cross-origin', '  Permissions-Policy: camera=(), microphone=(), geolocation=()', '  X-Frame-Options: DENY',
    '/assets/*', '  Cache-Control: public, max-age=604800',
    '/admin/*', '  Cache-Control: no-store', '  X-Robots-Tag: noindex', '',
  ].join('\n'));
  await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /admin/\n');
}

const size = async (p) => (await stat(p)).size;
console.log(JSON.stringify({ mode, out: path.relative(project, out), app: await size(path.join(out, 'app.js')), admin: await size(path.join(out, 'admin/admin.js')) }));
