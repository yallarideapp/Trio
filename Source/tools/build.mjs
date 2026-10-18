// Builds the site.
//   node tools/build.mjs live           -> dist/  (served by the Cloudflare Worker)
//   node tools/build.mjs demo [outDir]  -> ../Demo/ (portable copy, opens from a folder)
//   node tools/build.mjs pages         -> ../website/ (catalog, no order/admin API)
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
if (mode !== 'pages') await build({ ...common, entryPoints: [path.join(source, 'site/admin/src/admin.js')], outfile: path.join(out, 'admin/admin.js') });

const htmlFiles = [['site/index.html', 'index.html']];
if (mode !== 'pages') htmlFiles.push(['site/admin/index.html', 'admin/index.html']);
for (const [from, to] of htmlFiles) {
  let html = (await readFile(path.join(source, from), 'utf8')).replaceAll('__BUILD__', stamp);
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
if (mode !== 'pages') await css('site/admin/admin.css', 'admin/admin.css');
await cp(path.join(source, 'site/assets'), path.join(out, 'assets'), { recursive: true });

if (mode === 'pages') {
  await writeFile(path.join(out, '.nojekyll'), '');
  await writeFile(path.join(out, 'admin/index.html'), `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>TRIO Mobile · لوحة التحكم</title><link rel="stylesheet" href="../styles.css?v=${stamp}"></head>
<body><main class="container page-shell"><h1>لوحة التحكم غير متاحة على هذه النسخة</h1><p>هذا الموقع يعرض الأجهزة ومعلومات التواصل. تواصل مع تريو للاستفسار عن الجهاز والسعر والتوفر.</p><p lang="en" dir="ltr">Admin and online ordering are unavailable on this site. Contact Trio to confirm device details, prices and availability.</p><a class="button button-dark" href="../index.html#/">العودة للموقع · Back to the store</a></main></body></html>`);
  await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /admin/\n');
}

if (mode === 'live') {
  const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
  await writeFile(path.join(out, '_headers'), [
    '/*', `  Content-Security-Policy: ${csp}`, '  X-Content-Type-Options: nosniff', '  Referrer-Policy: strict-origin-when-cross-origin', '  Permissions-Policy: camera=(), microphone=(), geolocation=()', '  X-Frame-Options: DENY',
    '/assets/*', '  Cache-Control: public, max-age=604800',
    '/admin/*', '  Cache-Control: no-store', '  X-Robots-Tag: noindex', '',
  ].join('\n'));
  await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /admin/\n');
}

const size = async (p) => (await stat(p)).size;
console.log(JSON.stringify({ mode, out: path.relative(project, out), app: await size(path.join(out, 'app.js')), admin: mode === 'pages' ? null : await size(path.join(out, 'admin/admin.js')) }));
