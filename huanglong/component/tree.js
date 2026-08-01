import { P, col } from '../palette.js';
import { poolFan } from './pools.js';

// ---------------------------------------------------------- forest
// Three conifers of the Min Shan, each a different habit:
//
//   picea  spruce   — stiff tiers, branchlets hanging off them
//   abies  fir      — flat combed ranks, blunter and narrower
//   tsuga  hemlock  — open and wide, the crown tipped by its sway
//
// One continuous axis runs from the root flare to the leader, and
// crownHalfAt() defines the silhouette: branch length, shadow mass
// and leader spray all derive from it, so no stroke reaches outside
// the outline. The bole is laid down after only the deepest fifth
// of the branches, leaving the rest of the foliage in front of it.
//
// Everything is keyed to tree height, so the same habit draws at 60
// px on the near bank and at 14 px up the slope — below which the
// tree becomes a wedge of tiers instead, since at that size the
// machinery is invisible and only costs strokes.

let FLOOR = 1e9;                // no foliage stroke may fall below the base

// The tone distance dissolves a tree into. Not the haze itself — a
// far tree has to stay a shade under the mist it stands in, or the
// stand turns to frost on the slope.
const MIST = [196, 174, 140];
let VEIL = MIST;

const rr = (a, b) => random(a, b);
const clampY = y => min(y, FLOOR);

function jline(x1, y1, x2, y2, j) {
  line(x1 + rr(-j, j), clampY(y1 + rr(-j, j)),
    x2 + rr(-j, j), clampY(y2 + rr(-j, j)));
}

function qp(p0, p1, p2, t) {    // point on a quadratic bezier
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
  };
}

function curvePath(p0, p1, p2, steps, j) {
  noFill();
  beginShape();
  for (let i = 0; i <= steps; i++) {
    const p = qp(p0, p1, p2, i / steps);
    vertex(p.x + rr(-j, j), clampY(p.y + rr(-j, j)));
  }
  endShape();
}

// the trunk leans as it climbs; every branch hangs off this line
function axisX(cx, baseY, H, sway, y) {
  const u = (baseY - y) / H;
  return cx + sway * sin(u * 2.4) * H * 0.016;
}

function axisHalf(baseY, boleTop, baseW, y) {
  const t = constrain((baseY - y) / (baseY - boleTop), 0, 1);
  return (baseW * pow(1 - t, 1.5)) / 2 + 0.4;
}

// THE silhouette
function crownHalfAt(baseY, H, o, y) {
  const bottom = baseY - H * o.clearBole, top = baseY - H + o.apexGap * H;
  const t = constrain((bottom - y) / (bottom - top), 0, 1);
  return pow(1 - t, o.taper) * H * o.width + o.minLen * (1 - pow(t, 2.4));
}

// width built from overlapping short strokes, never one long spike
function tuft(x, y, s, half, droop, d, l, wt, maxLen) {
  const n = max(1, round(half / 2.0));
  for (let i = 0; i < n; i++) {
    const off = (i / n) * half;
    const ln = min(maxLen, half - off + 1.1);
    stroke(lerpColor(d, l, random()));
    strokeWeight(wt);
    jline(x + s * off, y + off * 0.28,
      x + s * (off + ln * 0.85), y + off * 0.28 + ln * droop, 0.35);
  }
}

// near foliage keeps its pigment; far foliage is drunk by the haze
function depthPair(base, z, haze) {
  const k = (z + 1) / 2;                          // -1 behind … +1 in front
  const body = lerpColor(col(P.leafDeep), base, 0.34 + 0.66 * k);
  const d = lerpColor(body, col(P.ink), 0.42);
  const l = lerpColor(body, col(P.leafMid), 0.14 + 0.30 * k);
  return {
    d: lerpColor(d, col(VEIL), haze),
    l: lerpColor(l, col(VEIL), haze)
  };
}

// ------------------------------------------------ crown construction

function growRings(cx, baseY, H, o) {
  const boughs = [];
  const bottom = baseY - H * o.clearBole;
  const top = baseY - H + H * o.apexGap;
  for (let i = 0; i < o.rings; i++) {
    const t = pow(i / (o.rings - 1), o.ringEase);
    const y = lerp(bottom, top, t);
    const spread = crownHalfAt(baseY, H, o, y);
    const k = round(lerp(o.kBottom, o.kTop, t));
    const off = rr(0, TWO_PI);
    for (let j = 0; j < k; j++) {
      if (o.gaps && t < 0.75 && random() < o.gaps) continue;
      addBough(boughs, cx, baseY, H, off + j * TWO_PI / k + rr(-0.2, 0.2), y, spread, t, o);
    }
    if (random() < o.frontBias)
      addBough(boughs, cx, baseY, H, HALF_PI + rr(-0.55, 0.55), y + rr(-3, 3) * o.q, spread, t, o);
  }
  boughs.sort((a, b) => a.z - b.z);               // back of the crown first
  return boughs;
}

function addBough(arr, cx, baseY, H, th, y, spread, t, o) {
  const c = cos(th), s = sin(th);
  const fore = 0.24 + 0.76 * abs(c);              // foreshortened side-on
  const yy = constrain(y + s * o.nearDrop + rr(-2, 2) * o.q, o.topLimit, baseY);
  arr.push({
    y: yy,
    ax: axisX(cx, baseY, H, o.sway, yy),
    hub: axisHalf(baseY, o.boleTop, o.baseW, yy),
    side: c >= 0 ? 1 : -1,
    len: spread * fore * rr(0.84, 1.08) * (c >= 0 ? o.biasR : o.biasL),
    low: 1 - t, t, z: s
  });
}

// Massed shadow inside the crown, so the foliage has a body to sit
// on. It starts well above the lowest boughs — carried all the way
// down it pools around the foot of the trunk, where no foliage is
// drawn in front of it to break it up.
// It also thins with the tree: a small crown is drawn with too few
// boughs to hide a mass this dark behind them.
function crownCore(cx, baseY, H, o) {
  const bottom = baseY - H * (o.clearBole + 0.10), top = o.crownTopY;
  const strength = o.solid * (0.22 + 0.78 * o.q);
  noStroke();
  for (const [k, a] of [[1.00, 15], [0.80, 17], [0.60, 20], [0.38, 24]]) {
    fill(P.ink[0] - 8, P.ink[1] - 4, P.ink[2] - 8, a * strength);
    beginShape();
    for (let i = 0; i <= 22; i++) {
      const t = i / 22, y = lerp(bottom, top, t);
      const w = crownHalfAt(baseY, H, o, y) * o.coreFrac * k * rr(0.86, 1.06);
      vertex(axisX(cx, baseY, H, o.sway, y) - w, y);
    }
    for (let i = 22; i >= 0; i--) {
      const t = i / 22, y = lerp(bottom, top, t);
      const w = crownHalfAt(baseY, H, o, y) * o.coreFrac * k * rr(0.86, 1.06);
      vertex(axisX(cx, baseY, H, o.sway, y) + w, y);
    }
    endShape(CLOSE);
  }
}

function band(xs, ys, ws, a, b, c) {
  noStroke(); fill(c);
  beginShape();
  for (let i = 0; i < xs.length; i++) vertex(xs[i] + ws[i] * a, ys[i]);
  for (let i = xs.length - 1; i >= 0; i--) vertex(xs[i] + ws[i] * b, ys[i]);
  endShape(CLOSE);
}

function bole(cx, baseY, H, o) {
  const boleTop = o.boleTop, n = 20, xs = [], ys = [], ws = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, y = lerp(baseY, boleTop, t);
    ys.push(y);
    xs.push(axisX(cx, baseY, H, o.sway, y));
    ws.push(axisHalf(baseY, boleTop, o.baseW, y) + o.baseW * 0.42 * pow(max(0, 1 - t * 9), 2));
  }
  const lit = lerpColor(col(P.barkLit), col(VEIL), o.haze);
  const mid = lerpColor(col(P.bark), col(VEIL), o.haze);
  const dark = lerpColor(color(P.bark[0] - 16, P.bark[1] - 14, P.bark[2] - 12),
    col(VEIL), o.haze);

  // A slender trunk cannot carry three bands — one wet stroke
  // instead, tapered by hand: the root flare above is far too abrupt
  // to survive as a round cap, and lands as a blot at the foot.
  if (o.baseW < 3.6) {
    noFill(); stroke(mid); strokeCap(ROUND);
    for (let i = 0; i < n; i++) {
      strokeWeight(max(0.7, o.baseW * lerp(1.3, 0.3, pow(i / n, 0.6))));
      line(xs[i], ys[i], xs[i + 1], ys[i + 1]);
    }
    return;
  }

  band(xs, ys, ws, -1.00, -0.30, lit);
  band(xs, ys, ws, -0.30, 0.34, mid);
  band(xs, ys, ws, 0.34, 1.00, dark);
  stroke(P.ink[0], P.ink[1], P.ink[2], 80 * o.solid);
  strokeWeight(0.6);
  for (let i = 0; i < 24; i++) {                  // bark fissures
    const t = rr(0, 0.8), y = lerp(baseY, boleTop, t);
    const w = axisHalf(baseY, boleTop, o.baseW, y);
    const ax = axisX(cx, baseY, H, o.sway, y);
    line(ax + rr(-w, w) * 0.8, y, ax + rr(-w, w) * 0.8 + rr(-1, 1), y - rr(3, 10) * o.q);
  }
  noStroke();
}

// the bare leading shoot above the bole, bark fading into foliage
function stem(cx, baseY, H, o, base) {
  const n = 14, from = o.boleTop, to = o.stemTop;
  const barkC = lerpColor(col(P.bark), col(VEIL), o.haze);
  const tipC = lerpColor(base, col(VEIL), o.haze);
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const y0 = lerp(from, to, t0), y1 = lerp(from, to, t1);
    stroke(lerpColor(barkC, tipC, t0));
    strokeWeight(lerp(axisHalf(baseY, from, o.baseW, y0) * 2, 0.7, t0));
    line(axisX(cx, baseY, H, o.sway, y0), y0, axisX(cx, baseY, H, o.sway, y1), y1);
  }
}

function leaderSpray(cx, baseY, H, o, base, span, droop) {
  const { d, l } = depthPair(base, 0.55, o.haze);
  const tipY = baseY - H, rows = max(6, round(18 * o.q));
  for (let k = 0; k < rows; k++) {
    const y = tipY + 1.5 * o.q + (k / (rows - 1)) * (H * span);
    const ax = axisX(cx, baseY, H, o.sway, y);
    const half = crownHalfAt(baseY, H, o, y) * 0.88 + 0.9 * o.q;
    tuft(ax, y, -1, half, droop, d, l, o.wt * 0.9, 3.2 * o.q);
    tuft(ax, y, 1, half, droop, d, l, o.wt * 0.9, 3.2 * o.q);
  }
}

function groundShade(cx, baseY, r, solid) {
  noStroke();
  fill(P.ink[0], P.ink[1], P.ink[2], 15 * solid); ellipse(cx, baseY + 1, r * 2.8, r * 0.34);
  fill(P.ink[0], P.ink[1], P.ink[2], 13 * solid); ellipse(cx - r * 0.2, baseY, r * 1.6, r * 0.22);
}

// bole goes down after only the deepest branches, so the great
// majority of the foliage draws in front of it
function buildHabit(cx, baseY, H, o, base, drawBough, apexFn) {
  FLOOR = baseY - max(1, H * 0.007);
  groundShade(cx, baseY, H * o.width, o.solid);
  crownCore(cx, baseY, H, o);
  const boughs = growRings(cx, baseY, H, o);
  let placed = false;
  for (const b of boughs) {
    if (!placed && b.z > o.boleDepth) {
      bole(cx, baseY, H, o);
      stem(cx, baseY, H, o, base);
      apexFn();
      placed = true;
    }
    drawBough(b);
  }
  if (!placed) { bole(cx, baseY, H, o); stem(cx, baseY, H, o, base); apexFn(); }
  FLOOR = 1e9;
}

// shared option block; q is the detail scale, 1 at a full-height tree
function habitOpts(baseY, H, haze, q, extra) {
  return Object.assign({
    ringEase: 0.82, apexGap: 0.015, boleDepth: -0.80,
    stemTop: baseY - H, topLimit: baseY - H + max(1, H * 0.007),
    crownTopY: baseY - H,
    q, haze, solid: 1 - haze,
    wt: lerp(0.5, 1, q),
  }, extra);
}

// ---------------------------------------------------------- habits

function habitSpruce(cx, baseY, H, base, haze, q) {
  const o = habitOpts(baseY, H, haze, q, {
    rings: round(lerp(9, 26, q)), kBottom: round(lerp(5, 8, q)), kTop: round(lerp(4, 6, q)),
    taper: 1.25, width: 0.30, minLen: H * 0.024,
    clearBole: 0.15, nearDrop: H * 0.012, frontBias: 0.85, coreFrac: 0.55,
    gaps: 0.05, sway: rr(-1, 1), baseW: H * 0.045, boleTop: baseY - H * 0.72,
    biasL: rr(0.9, 1.0), biasR: rr(0.9, 1.0), step: lerp(0.13, 0.05, q),
  });
  buildHabit(cx, baseY, H, o, base,
    b => spruceBough(b, base, o),
    () => leaderSpray(cx, baseY, H, o, base, 0.11, 0.55));
}

// one arching rib, branchlets hanging off it all the way out
function spruceBough(b, base, o) {
  const s = b.side, len = b.len, low = b.low;
  const { d, l } = depthPair(base, b.z, o.haze);
  const wt = o.wt * lerp(0.42, 0.86, (b.z + 1) / 2);
  const p0 = { x: b.ax + s * b.hub, y: b.y };
  const hang = (1.2 * o.q + len * 0.18);          // how far branchlets fall
  const p2y = max(b.y, min(b.y + (3 + low * 20) * o.q, FLOOR - hang * 0.5));
  const p2 = { x: p0.x + s * len, y: p2y };
  const p1 = { x: p0.x + s * len * 0.5, y: b.y + (-5 + low * 8) * o.q };
  stroke(d); strokeWeight(wt);
  curvePath(p0, p1, p2, 10, 0.3 * o.q);
  strokeWeight(wt * 0.8);
  let i = 0;
  for (let t = 0.03; t < 1; t += o.step, i++) {
    const p = qp(p0, p1, p2, t);
    const hl = hang * (0.42 + 0.78 * sin(pow(t, 0.75) * PI));
    stroke(lerpColor(d, l, t < 0.55 ? pow(random(), 1.8) * 0.5 : 0.35 + random() * 0.65));
    jline(p.x, p.y, p.x + s * hl * 0.34, p.y + hl, 0.4 * o.q);
    jline(p.x, p.y, p.x + s * hl * 0.12, p.y + hl * 0.64, 0.4 * o.q);
    jline(p.x, p.y, p.x + s * hl * 0.52, p.y - hl * 0.20, 0.4 * o.q);
    if (i % 2 === 0) jline(p.x, p.y, p.x - s * hl * 0.18, p.y + hl * 0.52, 0.4 * o.q);
  }
}

function habitFir(cx, baseY, H, base, haze, q) {
  const o = habitOpts(baseY, H, haze, q, {
    rings: round(lerp(10, 28, q)), kBottom: round(lerp(5, 8, q)), kTop: round(lerp(4, 6, q)),
    ringEase: 0.80, taper: 0.95, width: 0.195, minLen: H * 0.017,
    clearBole: 0.11, nearDrop: H * 0.008, frontBias: 0.9, coreFrac: 0.62,
    gaps: 0.02, sway: rr(-0.6, 0.6), baseW: H * 0.041, boleTop: baseY - H * 0.62,
    biasL: rr(0.92, 1.02), biasR: rr(0.92, 1.02), step: lerp(0.20, 0.085, q),
    ribs: q < 0.45 ? 2 : 3,
  });
  buildHabit(cx, baseY, H, o, base,
    b => firBough(b, base, o),
    () => leaderSpray(cx, baseY, H, o, base, 0.09, 0.25));
}

// several flat ribs off one point, needles combed either side
function firBough(b, base, o) {
  const s = b.side, len = b.len, low = b.low;
  const { d, l } = depthPair(base, b.z, o.haze);
  const wt = o.wt * lerp(0.4, 0.8, (b.z + 1) / 2);
  const p0 = { x: b.ax + s * b.hub, y: b.y };
  const ribs = o.ribs;
  for (let r = 0; r < ribs; r++) {
    const u = (r / (ribs - 1)) - 0.5;
    const rl = len * (0.60 + 0.40 * cos(u * PI));
    const reach = (0.9 * o.q + rl * 0.17) * 0.9;
    const tipY = max(b.y - 6 * o.q,
      min(b.y + u * rl * 0.55 + (low * 6 - 2) * o.q, FLOOR - reach));
    const tip = { x: p0.x + s * rl, y: tipY };
    const ctl = { x: p0.x + s * rl * 0.5, y: b.y + u * rl * 0.20 - 3 * o.q };
    stroke(d); strokeWeight(wt);
    curvePath(p0, ctl, tip, 8, 0.25 * o.q);
    strokeWeight(wt * 0.72);
    stroke(lerpColor(d, l, 0.15 + random() * 0.2));
    let half = false;
    for (let t = 0.04; t < 1; t += o.step) {
      if (!half && t > 0.55) { stroke(lerpColor(d, l, 0.55 + random() * 0.45)); half = true; }
      const p = qp(p0, ctl, tip, t);
      const nl = (0.9 * o.q + rl * 0.17) * (0.45 + 0.65 * sin(pow(t, 0.75) * PI));
      jline(p.x, p.y, p.x + s * nl * 0.48, p.y - nl * 0.78, 0.28 * o.q);
      jline(p.x, p.y, p.x + s * nl * 0.48, p.y + nl * 0.78, 0.28 * o.q);
      jline(p.x, p.y, p.x + s * nl * 0.92, p.y + nl * 0.10, 0.28 * o.q);
    }
  }
}

// A hemlock's leading shoot nods over, but at this size that reads as
// a stray antenna — so the lean lives in the axis sway instead and the
// whole top of the crown tips with it, foliage and all.
function habitHemlock(cx, baseY, H, base, haze, q) {
  const o = habitOpts(baseY, H, haze, q, {
    rings: round(lerp(9, 25, q)), kBottom: round(lerp(4, 7, q)), kTop: round(lerp(4, 6, q)),
    taper: 1.05, width: 0.34, minLen: H * 0.028,
    clearBole: 0.18, nearDrop: H * 0.016, frontBias: 0.75, coreFrac: 0.50,
    gaps: 0.14, sway: rr(-1.9, 1.9), baseW: H * 0.045, boleTop: baseY - H * 0.74,
    biasL: rr(0.82, 1.05), biasR: rr(0.82, 1.05), step: lerp(0.18, 0.075, q),
    ribs: q < 0.45 ? 2 : 3,
  });
  buildHabit(cx, baseY, H, o, base,
    b => hemlockBough(b, base, o),
    () => leaderSpray(cx, baseY, H, o, base, 0.10, 0.75));
}

function hemlockBough(b, base, o) {
  const s = b.side, len = b.len, low = b.low;
  const { d, l } = depthPair(base, b.z, o.haze);
  const wt = o.wt * lerp(0.4, 0.82, (b.z + 1) / 2);
  const p0 = { x: b.ax + s * b.hub, y: b.y };
  const ribs = o.ribs;
  for (let r = 0; r < ribs; r++) {
    const u = (r / (ribs - 1)) - 0.5;
    const rl = len * (0.62 + 0.38 * cos(u * PI));
    const reach = (1.0 * o.q + rl * 0.18) * 0.95;
    const tipY = max(b.y - 4 * o.q,
      min(b.y + u * rl * 0.4 + (5 + low * 14) * o.q, FLOOR - reach));
    const tip = { x: p0.x + s * rl, y: tipY };
    const ctl = { x: p0.x + s * rl * 0.55, y: b.y + u * rl * 0.14 - 2 * o.q };
    stroke(d); strokeWeight(wt);
    curvePath(p0, ctl, tip, 8, 0.3 * o.q);
    strokeWeight(wt * 0.7);
    stroke(lerpColor(d, l, 0.1 + random() * 0.25));
    let half = false;
    for (let t = 0.04; t < 1; t += o.step) {
      if (!half && t > 0.6) { stroke(lerpColor(d, l, 0.6 + random() * 0.4)); half = true; }
      const p = qp(p0, ctl, tip, t);
      const nl = (1.0 * o.q + rl * 0.18) * (0.42 + 0.68 * sin(pow(t, 0.75) * PI));
      jline(p.x, p.y, p.x + s * nl * 0.82, p.y + nl * 0.44, 0.3 * o.q);
      jline(p.x, p.y, p.x + s * nl * 0.62, p.y - nl * 0.38, 0.3 * o.q);
      jline(p.x, p.y, p.x + s * nl * 0.26, p.y + nl * 0.88, 0.3 * o.q);
    }
  }
}

// -------------------------------------------------- the far ranks
// Under ~20 px the boughs land on top of each other and read as one
// smudge anyway, so the habit is stated with a dozen tiers instead.
function farHabit(cx, baseY, H, base, haze, sp) {
  const g = lerpColor(base, col(VEIL), haze);
  const dark = lerpColor(lerpColor(base, col(P.leafDeep), 0.55), col(VEIL), haze);
  FLOOR = baseY;

  stroke(lerpColor(col(P.bark), col(VEIL), min(1, haze + 0.15)));
  strokeWeight(max(0.6, H * 0.035));
  line(cx, baseY, cx, baseY - H * 0.4);

  const rows = max(5, round(H * 0.55));
  const sway = rr(-1, 1) * H * 0.03;
  strokeWeight(max(0.65, H * 0.045));
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1);
    const y = lerp(baseY - H * 0.14, baseY - H, t);
    const ax = cx + sway * t;
    const half = pow(1 - t, sp.taper) * H * sp.width + H * 0.035;
    stroke(lerpColor(dark, g, 0.12 + 0.72 * random()));
    jline(ax, y, ax - half, y + half * sp.droop, H * 0.012);
    jline(ax, y, ax + half, y + half * sp.droop, H * 0.012);
  }
  FLOOR = 1e9;
}

// ------------------------------------------------------------ trees

const SPECIES = {
  picea: { taper: 1.25, width: 0.30, droop: 0.55, habit: habitSpruce },
  abies: { taper: 0.95, width: 0.21, droop: 0.30, habit: habitFir },
  tsuga: { taper: 1.05, width: 0.34, droop: 0.62, habit: habitHemlock },
};

// species pigment, mixed from the same minerals as the slopes
function speciesGreen(kind, gold) {
  let c;
  if (kind === 'picea') c = lerpColor(col(P.leafDeep), col(P.azurite), 0.16);
  else if (kind === 'abies') c = lerpColor(col(P.leafDeep), col(P.malachite), 0.42);
  else c = lerpColor(col(P.leafMid), col(P.malachite), 0.34);
  return gold ? lerpColor(c, col(P.leafGold), gold) : c;
}

// One conifer standing on (x, baseY), H tall. haze 0 near, 1 dissolved;
// gold blends the foliage toward the ochre of an autumn larch stand.
// veil is what distance dissolves it into — the valley mist by default,
// but a tree up on a flank has to pale into the slope behind it, not
// into a mist that is nowhere near it.
export function paintTree(kind, x, baseY, H, haze = 0, gold = 0, veil = MIST) {
  const sp = SPECIES[kind] || SPECIES.picea;
  VEIL = veil;
  const base = speciesGreen(kind, gold);
  push();
  strokeCap(ROUND);
  if (H < 20) farHabit(x, baseY, H, base, haze, sp);
  else sp.habit(x, baseY, H, base, haze, constrain(H / 150, 0.2, 1));
  pop();
  VEIL = MIST;
}

// Forest on the banks of the terrace fan. Rather than scattering the
// stand over the valley floor, every tree is placed off the pool edge
// itself: a belt is walked from the valley head (q = 0: small, hazy,
// hemmed in where the fan is narrow) down to where the terraces reach
// the canvas side (q = 1: near, full height, full pigment), standing
// `out` px back from the water. The bank climbs as it draws away from
// the pools, so that same offset lifts the tree up the slope.
//
// Three belts deep: the first has its feet at the rim — the terraces
// are painted afterwards and close over the root flare, which is what
// stops the trees reading as cut-outs laid on the basin.
const BANK_RISE = 0.34;         // how fast the bank climbs off the water

const BELTS = [
  {
    t0: 0.030, t1: 0.470, out: [4, 24], h0: 34, h1: 198,
    z0: 0.44, z1: 0.02, gap: [0.028, 0.078], clump: [2, 5], spread: 0.014
  },
  {
    t0: 0.010, t1: 0.300, out: [36, 94], h0: 27, h1: 134,
    z0: 0.56, z1: 0.16, gap: [0.024, 0.062], clump: [2, 5], spread: 0.016
  },
  // the back of the stand, thinning as it lifts toward the flank
  {
    t0: 0.000, t1: 0.205, out: [104, 190], h0: 20, h1: 79,
    z0: 0.68, z1: 0.36, gap: [0.034, 0.095], clump: [1, 4], spread: 0.018
  },
];

// Where a belt actually has to stop. The fan widens as the terraces
// grow, and past some depth the bank it sits on has left the canvas —
// a belt walked to its nominal t1 spends its near end, and so its
// tallest trees, off the frame. Walk back to the last depth still in
// shot and end the belt there, so the stand keeps its full range of
// height whatever size the pools are.
function beltEnd(b, side) {
  let t = b.t1;
  for (; t > b.t0; t -= 0.004) {
    const x = poolFanX(t, side, b.out[1]);
    if (x > -40 && x < width + 40) break;
  }
  return t;
}

function poolFanX(t, side, out) {
  const f = poolFan(t);
  return f.cx + side * (f.edge + out);
}

// spruce and fir carry the stand; hemlock shows up in the open
function pickKind() {
  const u = random();
  return u < 0.46 ? 'picea' : u < 0.80 ? 'abies' : 'tsuga';
}

export function paintTrees() {
  const stand = [];
  for (const side of [-1, 1]) {
    for (const b of BELTS) {
      const tEnd = beltEnd(b, side);
      // groves with gaps between them, never an even picket line
      let p = rr(0, 0.05);
      while (p < 1) {
        const grove = pickKind();
        const n = floor(rr(b.clump[0], b.clump[1] + 1));
        for (let i = 0; i < n; i++) {
          const q = constrain(p + rr(-b.spread, b.spread), 0, 1);
          const f = poolFan(lerp(b.t0, tEnd, q));
          const out = lerp(b.out[0], b.out[1], q) * rr(0.78, 1.3);
          const near = pow(q, 1.15);
          const haze = constrain(lerp(b.z0, b.z1, pow(q, 0.8)) + rr(-0.05, 0.05), 0, 1);
          const x = f.cx + side * (f.edge + out);
          if (x < -70 || x > width + 70) continue;   // walked off the frame
          stand.push({
            kind: random() < 0.25 ? pickKind() : grove,
            x,
            // f.y is the row's centre; stand on the bank above its rim,
            // close enough that the terrace still closes over the roots
            y: f.y - f.ry * 0.85 - out * BANK_RISE + rr(-1, 1) * height * 0.006,
            H: lerp(b.h0, b.h1, near) * rr(0.70, 1.34),   // broken crown line
            haze,
            // a few stands turning, picking up the ochre of the roof
            gold: haze < 0.34 && random() < 0.13 ? rr(0.24, 0.5) : 0,
          });
        }
        p += rr(b.gap[0], b.gap[1]);
      }
    }
  }
  // farthest up the slope first, so every tree overlaps the one behind
  stand.sort((a, b) => a.y - b.y);
  for (const t of stand) paintTree(t.kind, t.x, t.y, t.H, t.haze, t.gold);
}
