const parse = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/** Blend two #rrggbb colours; t = 0 gives a, t = 1 gives b. */
export function mix(a, b, t) {
  const pa = parse(a);
  const pb = parse(b);
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
export const darken = (hex, t) => mix(hex, '#000000', t);
export const lighten = (hex, t) => mix(hex, '#ffffff', t);

const r1 = (v) => Math.round(v * 10) / 10;

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(pts, closed = true) {
  const n = pts.length;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return closed ? `${d} Z` : d;
}

/** `count` points along a cubic Bézier. */
export function bezier(p0, p1, p2, p3, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const u = 1 - t;
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    out.push([
      w[0] * p0[0] + w[1] * p1[0] + w[2] * p2[0] + w[3] * p3[0],
      w[0] * p0[1] + w[1] * p1[1] + w[2] * p2[1] + w[3] * p3[1],
    ]);
  }
  return out;
}

/**
 * Offset a centre line by per-point half widths into a closed outline, e.g. a lock of hair.
 * `wave` shifts the whole strand sideways in a sine, for wavy hair.
 */
export function strand(centre, widths, wave = 0) {
  const n = centre.length;
  const left = [];
  const right = [];
  const mid = [];
  for (let i = 0; i < n; i++) {
    const [px, py] = centre[Math.max(0, i - 1)];
    const [nx, ny] = centre[Math.min(n - 1, i + 1)];
    const len = Math.hypot(nx - px, ny - py) || 1;
    const [tx, ty] = [(nx - px) / len, (ny - py) / len];
    const [ox, oy] = [-ty, tx];
    const shift = wave * Math.sin(i * 0.95);
    const cx = centre[i][0] + ox * shift;
    const cy = centre[i][1] + oy * shift;
    mid.push([cx, cy]);
    left.push([cx + ox * widths[i], cy + oy * widths[i]]);
    right.push([cx - ox * widths[i], cy - oy * widths[i]]);
  }
  const [ex, ey] = mid[n - 1];
  const [bx, by] = mid[n - 2];
  const len = Math.hypot(ex - bx, ey - by) || 1;
  const tip = [ex + ((ex - bx) / len) * widths[n - 1] * 0.8, ey + ((ey - by) / len) * widths[n - 1] * 0.8];
  return { outline: smoothPath([...left, tip, ...right.reverse()]), mid };
}

export const mirrorPoints = (pts) => pts.map(([x, y]) => [200 - x, y]);

export function starPath(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${r1(cx + rr * Math.cos(a))} ${r1(cy + rr * Math.sin(a))}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** Deterministic pseudo-random sequence, so scattered flakes and stars never jump between renders. */
export function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
