// Home hero motion (2026-10-20). Each default hero photo has its own short animation:
//   iPhone   the screen lights up
//   MacBook  the lid opens on its hinge, then the screen lights up
//   Watch    raised as if to look at it, then the screen lights up
//   AirPods  the earbuds rise out of their wells and settle into place
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
    back: `${DIR}airpods-pro-case-empty.webp`,
    // Each earbud starts deep in its well, hidden behind the well's front edge (edge, left to right,
    // in photo pixels). It rises out (sink), past where the photo shows it (lift), then settles into place.
    buds: [
      {
        src: `${DIR}airpods-pro-bud-left.webp`, box: [169, 138, 454, 522], sink: 340, lift: 84, tilt: -5, delay: 0,
        edge: [[107, 372], [110, 404], [116, 417], [144, 445], [158, 452], [196, 459], [296, 458], [318, 449], [399, 446], [423, 440], [450, 425], [469, 405], [489, 350]],
      },
      {
        src: `${DIR}airpods-pro-bud-right.webp`, box: [542, 25, 828, 463], sink: 456, lift: 34, tilt: 5, delay: 140,
        edge: [[507, 334], [508, 358], [521, 396], [532, 411], [549, 427], [573, 440], [615, 448], [682, 449], [704, 458], [801, 459], [819, 457], [840, 451], [865, 435], [888, 398], [889, 371]],
      },
    ],
  },
];

export const heroRigFor = (src) => RIGS.find((rig) => typeof src === 'string' && (src === rig.match || src.endsWith(`/${rig.match}`))) || null;
export const heroMotionAssets = () => RIGS.flatMap((r) => [r.off, r.base, r.lid, r.lidOff, r.back, ...(r.buds || []).map((b) => b.src)].filter(Boolean));

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
    const s = box.s, px = (v) => `${(v * s).toFixed(2)}px`;
    // Each earbud sits in its own full-size layer, clipped to what is in front of its well while it is inside the case.
    stage.innerHTML = `<img class="hero-pods-layer" alt="" src="${rig.back}">${rig.buds.map((b) => `<div class="hero-pods-well"><img class="hero-pods-bud" alt="" src="${b.src}"></div>`).join('')}`;
    const wells = [...stage.querySelectorAll('.hero-pods-well')], buds = wells.map((w) => w.firstElementChild);
    rig.buds.forEach((b, i) => { const [x0, y0, x1, y1] = b.box; Object.assign(buds[i].style, { left: px(x0), top: px(y0), width: px(x1 - x0), height: px(y1 - y0) }); });
    img.style.opacity = '0';
    ready([...stage.querySelectorAll('img')]).then(() => {
      if (done) return;
      stage.animate([{ transform: 'translateY(14px) scale(.98)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      const rise = 640, settle = 540, k = rise / (rise + settle), rim = 215;   // rim: above it nothing of the case is in front
      let waiting = buds.length;
      rig.buds.forEach((b, i) => {
        const e = b.edge, last = e[e.length - 1];
        const shape = [[-1000, -1000], [2000, -1000], [2000, rim], [last[0], rim], ...e.slice().reverse(), [e[0][0], rim], [-1000, rim]];
        const clip = `polygon(${shape.map(([x, y]) => `${px(x)} ${px(y)}`).join(',')})`;
        const timing = { duration: rise + settle, delay: 380 + b.delay, fill: 'both' };
        // Once the earbud is clear of the case (the top of its rise) nothing is in front of it any more.
        wells[i].animate([{ clipPath: clip }, { clipPath: clip, offset: k }, { clipPath: 'none', offset: k }, { clipPath: 'none' }], timing);
        const move = buds[i].animate([
          { transform: `translateY(${px(b.sink)}) rotate(${b.tilt}deg)`, easing: 'cubic-bezier(.18,.72,.32,1)' },
          { transform: `translateY(${px(-b.lift)}) rotate(${(-b.tilt * 0.15).toFixed(2)}deg)`, offset: k, easing: 'cubic-bezier(.42,0,.28,1)' },
          { transform: 'none' },
        ], timing);
        move.onfinish = () => { if (--waiting === 0) setTimeout(() => end(260), 120); };
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
