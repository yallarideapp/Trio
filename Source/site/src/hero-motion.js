// Home hero motion (2026-10-20). Each default hero photo has its own short animation:
//   iPhone   the screen lights up
//   MacBook  the lid opens on its hinge, then the screen lights up
//   Watch    raised as if to look at it, then the screen lights up
//   AirPods  the earbuds rise out of the case
// The layers are cut from the same photos (Documents/IMAGE-ASSETS.md). When the motion ends
// the original photo is shown again. Any other photo (another device, an uploaded photo)
// keeps the simple fade. Nothing moves when the visitor prefers reduced motion.

const DIR = 'assets/hero/';
const RIGS = [
  { match: 'assets/devices/iphone-17-pro-max.webp', kind: 'screen', off: `${DIR}iphone-17-pro-max-screen-off.webp` },
  { match: 'assets/devices/huawei-watch-gt6.webp', kind: 'wake', off: `${DIR}huawei-watch-gt6-screen-off.webp` },
  {
    match: 'assets/devices/macbook-pro.webp', kind: 'lid', size: [1200, 822],
    base: `${DIR}macbook-pro-base.webp`, lid: `${DIR}macbook-pro-lid.webp`, lidOff: `${DIR}macbook-pro-lid-off.webp`,
    // Pixel positions in the photo: the lid's crop, its top corners when open, the hinge ends,
    // and where the top corners rest when the lid is shut (the front corners of the base).
    crop: [28, 30, 884, 631], open: [[30.8, 31.8], [792.4, 60.8]], hinge: [[96.6, 628.1], [881, 575.2]], closed: [[317.2, 787.3], [1224.4, 706.2]], angle: 110,
  },
  {
    match: 'assets/categories/airpods-pro.png', kind: 'pods', size: [1000, 1000],
    back: `${DIR}airpods-pro-case-empty.webp`, front: { src: `${DIR}airpods-pro-case-front.webp`, box: [0, 517, 1000, 1000] },
    // Each bud starts inside the case (hidden by its front) and rises to where the photo shows it.
    buds: [
      { src: `${DIR}airpods-pro-bud-left.webp`, box: [166, 141, 475, 523], from: [14, 430, -7], delay: 0 },
      { src: `${DIR}airpods-pro-bud-right.webp`, box: [534, 22, 830, 458], from: [-10, 530, 7], delay: 160 },
    ],
  },
];

export const heroRigFor = (src) => RIGS.find((rig) => typeof src === 'string' && (src === rig.match || src.endsWith(`/${rig.match}`))) || null;
export const heroMotionAssets = () => RIGS.flatMap((r) => [r.off, r.base, r.lid, r.lidOff, r.back, r.front?.src, ...(r.buds || []).map((b) => b.src)].filter(Boolean));

const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const image = (src, className) => { const el = document.createElement('img'); el.src = src; el.alt = ''; el.className = className; el.decoding = 'async'; el.draggable = false; return el; };
const ready = (imgs) => Promise.all(imgs.map((el) => (el.decode ? el.decode() : new Promise((ok, no) => { el.onload = ok; el.onerror = no; }))));

// Where the photo is drawn inside its <img> (object-fit: contain, centred), relative to the img's parent.
function drawnBox(img, [nw, nh]) {
  const cs = getComputedStyle(img);
  const pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0, pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
  const w = img.offsetWidth - pl - pr, h = img.offsetHeight - pt - pb, s = Math.min(w / nw, h / nh);
  return { s, left: img.offsetLeft + pl + (w - nw * s) / 2, top: img.offsetTop + pt + (h - nh * s) / 2, width: nw * s, height: nh * s };
}
const place = (el, box) => Object.assign(el.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });

let current = null; // the running motion, so a new one can end it

export function stopHeroMotion() { if (current) { current(); current = null; } }

export function playHeroMotion(root) {
  stopHeroMotion();
  const img = root && root.querySelector('.hero-device img');
  if (!img || reduced()) return;
  const rig = heroRigFor(img.getAttribute('src'));
  if (!rig) return;
  const holder = img.parentElement;
  const layers = [];
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    img.style.opacity = '';
    layers.forEach((el) => el.remove());
    holder.classList.remove('hero-motion-on');
  };
  current = finish;
  const fallback = setTimeout(finish, 4000);
  const end = (fadeMs = 220) => {
    if (done) return;
    img.style.opacity = '';
    layers.forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeMs, easing: 'ease', fill: 'forwards' }));
    setTimeout(() => { clearTimeout(fallback); finish(); }, fadeMs + 20);
  };
  holder.classList.add('hero-motion-on');
  img.style.animation = 'none';           // the motion replaces the photo's own fade-in

  if (rig.kind === 'screen' || rig.kind === 'wake') {
    const off = image(rig.off, 'hero-motion hero-motion-off');
    off.setAttribute('aria-hidden', 'true');
    const box = { left: img.offsetLeft, top: img.offsetTop, width: img.offsetWidth, height: img.offsetHeight };
    // Same size and fit as the photo, without its own fade-in or second shadow.
    Object.assign(off.style, { padding: getComputedStyle(img).padding, animation: 'none', filter: 'none' });
    place(off, box); holder.append(off); layers.push(off);
    holder.style.opacity = '0';
    ready([img, off]).then(() => {
      if (done) return;
      holder.style.opacity = '';
      const wake = rig.kind === 'wake';
      holder.animate(wake
        ? [{ transform: 'translateY(9%) rotate(-13deg) scale(.9)', opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: 'none', opacity: 1 }]
        : [{ transform: 'translateY(16px) scale(.97)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: wake ? 950 : 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
      const light = off.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, delay: wake ? 900 : 560, easing: 'ease-out', fill: 'forwards' });
      light.onfinish = () => { clearTimeout(fallback); finish(); };
    }).catch(() => { holder.style.opacity = ''; clearTimeout(fallback); finish(); });
    return;
  }

  const stage = document.createElement('div');
  stage.className = 'hero-motion hero-motion-stage'; stage.setAttribute('aria-hidden', 'true');
  holder.append(stage); layers.push(stage);
  const box = drawnBox(img, rig.size);
  place(stage, box);
  stage.style.filter = getComputedStyle(img).filter;   // keep the photo's shadow while it is hidden

  if (rig.kind === 'lid') {
    const s = box.s, [cx, cy, cx1, cy1] = rig.crop;
    stage.innerHTML = `<img class="hero-lid-base" alt="" src="${rig.base}"><div class="hero-lid"><div class="hero-lid-back" style="-webkit-mask-image:url(${rig.lid});mask-image:url(${rig.lid})"></div><img class="hero-lid-off" alt="" src="${rig.lidOff}"><img class="hero-lid-on" alt="" src="${rig.lid}"></div>`;
    const lid = stage.querySelector('.hero-lid'), on = stage.querySelector('.hero-lid-on');
    Object.assign(lid.style, { left: `${cx * s}px`, top: `${cy * s}px`, width: `${(cx1 - cx) * s}px`, height: `${(cy1 - cy) * s}px` });
    const local = ([x, y]) => [(x - cx) * s, (y - cy) * s], t0 = (rig.angle * Math.PI) / 180;
    // Each top corner travels on an arc around its hinge end, from the closed point to the open one.
    const arc = (i) => { const H = rig.hinge[i], a = [rig.closed[i][0] - H[0], rig.closed[i][1] - H[1]], o = rig.open[i]; const b = [(o[0] - H[0] - Math.cos(t0) * a[0]) / Math.sin(t0), (o[1] - H[1] - Math.cos(t0) * a[1]) / Math.sin(t0)]; return (th) => [H[0] + Math.cos(th) * a[0] + Math.sin(th) * b[0], H[1] + Math.cos(th) * a[1] + Math.sin(th) * b[1]]; };
    const left = arc(0), right = arc(1), src = [rig.open[0], rig.open[1], rig.hinge[1], rig.hinge[0]].map(local);
    const area = (q) => q.reduce((sum, p, i) => { const n = q[(i + 1) % 4]; return sum + p[0] * n[1] - n[0] * p[1]; }, 0) / 2, openArea = area(src);
    const pose = (th) => {
      const dst = [left(th), right(th), rig.hinge[1], rig.hinge[0]].map(local), ar = area(dst);
      if (Math.abs(ar) < Math.abs(openArea) * 0.015) { lid.style.opacity = '0'; return; }
      lid.style.opacity = '1'; lid.classList.toggle('is-back', Math.sign(ar) !== Math.sign(openArea));
      const m = homography(src, dst);
      lid.style.transform = `matrix3d(${m[0]},${m[3]},0,${m[6]},${m[1]},${m[4]},0,${m[7]},0,0,1,0,${m[2]},${m[5]},0,1)`;
    };
    pose(0); on.style.opacity = '0'; img.style.opacity = '0';
    ready([...stage.querySelectorAll('img')]).then(() => {
      if (done) return;
      stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease' });
      const hold = 220, dur = 1350, start = performance.now() + hold, ease = (p) => 1 - Math.pow(1 - p, 2.6);
      const frame = (now) => {
        if (done) return;
        const p = Math.min(1, Math.max(0, (now - start) / dur));
        pose(ease(p) * t0); on.style.opacity = String(Math.min(1, Math.max(0, (p - 0.62) / 0.38)));
        if (p < 1) requestAnimationFrame(frame); else setTimeout(() => end(), 160);
      };
      requestAnimationFrame(frame);
    }).catch(() => { clearTimeout(fallback); finish(); });
    return;
  }

  if (rig.kind === 'pods') {
    const s = box.s, f = rig.front.box;
    stage.innerHTML = `<img class="hero-pods-layer" alt="" src="${rig.back}">${rig.buds.map((b) => `<img class="hero-pods-bud" alt="" src="${b.src}">`).join('')}<img class="hero-pods-front" alt="" src="${rig.front.src}">`;
    const front = stage.querySelector('.hero-pods-front');
    Object.assign(front.style, { left: `${f[0] * s}px`, top: `${f[1] * s}px`, width: `${(f[2] - f[0]) * s}px`, height: `${(f[3] - f[1]) * s}px` });
    const buds = [...stage.querySelectorAll('.hero-pods-bud')];
    rig.buds.forEach((b, i) => { const [x0, y0, x1, y1] = b.box; Object.assign(buds[i].style, { left: `${x0 * s}px`, top: `${y0 * s}px`, width: `${(x1 - x0) * s}px`, height: `${(y1 - y0) * s}px` }); });
    img.style.opacity = '0';
    ready([...stage.querySelectorAll('img')]).then(() => {
      if (done) return;
      stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease' });
      let waiting = buds.length;
      rig.buds.forEach((b, i) => {
        const [dx, dy, turn] = b.from;
        const move = buds[i].animate([{ transform: `translate(${dx * s}px,${dy * s}px) rotate(${turn}deg)` }, { transform: 'none' }], { duration: 1150, delay: 300 + b.delay, easing: 'cubic-bezier(.22,.8,.24,1)', fill: 'both' });
        move.onfinish = () => { if (--waiting === 0) setTimeout(() => end(), 140); };
      });
    }).catch(() => { clearTimeout(fallback); finish(); });
  }
}

// The 3×3 projective map that takes the four corners src onto dst (row-reduced 8×8 system).
function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
  for (let c = 0; c < 8; c++) {
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) { if (r === c) continue; const k = A[r][c] / A[c][c]; for (let j = c; j < 8; j++) A[r][j] -= k * A[c][j]; b[r] -= k * b[c]; }
  }
  return b.map((v, i) => v / A[i][i]);
}
