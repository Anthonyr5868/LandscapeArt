import { P, col } from '../palette.js';
import { placedPools } from './pools.js';

// ---------------------------------------------------------- shrubs
// The dwarf growth that stands in the terraces themselves: sedge and
// scrub willow rooted on the calcite rims, a few of them ankle-deep
// in the shallows where the water only just covers the travertine.
//
// They are not small conifers. A conifer drawn at 12 px is a wedge
// with no drawing left in it, whereas a shrub at 12 px is a shrub —
// so this is built the other way round from tree.js: no axis, no
// habit machinery, just a mass with strokes on it. Three forms,
// which is as much variety as the eye can read at this size:
//
//   mound  a packed dome of leaf, the commonest thing on a rim
//   sprig  a few arching stems — the tiny-tree reading
//   tuft   sedge, blades and nothing else, for the wet margins
//
// Everything is keyed to shrub height, and every pigment is dissolved
// toward P.haze by the same amount as the pool it stands in, so a
// shrub never sits crisper than the water under it.

const rr = (a, b) => random(a, b);

function qp(p0, p1, p2, t) {    // point on a quadratic bezier
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
  };
}

// A shrub is nearly all shadowed leaf with a little light caught on
// its upper left, matching the slopes and the bark. gold carries the
// same ochre turn as the autumn stands above the bank.
function pigment(haze, gold) {
  let body = lerpColor(col(P.leafDeep), col(P.malachite), 0.30);
  if (gold) body = lerpColor(body, col(P.leafGold), gold);
  const d = lerpColor(body, col(P.ink), 0.34);
  const l = lerpColor(body, col(P.leafMid), 0.52);
  return {
    d: lerpColor(d, col(P.haze), haze),
    l: lerpColor(l, col(P.haze), haze),
    bark: lerpColor(col(P.bark), col(P.haze), min(1, haze + 0.12)),
  };
}

function alpha(c, a) { const k = color(red(c), green(c), blue(c)); k.setAlpha(a); return k; }

// ------------------------------------------------------ the forms

// Widest a little above the ground and tucked in at the foot, so the
// bush sits on the rim rather than being stuck to it as a half-disc.
function moundHalf(w, u) {
  return u < 0.34
    ? w * (0.66 + 0.34 * (u / 0.34))
    : w * pow(1 - pow((u - 0.34) / 0.66, 1.8), 0.55);
}

// leaf ticks in twos and threes, never one stroke on its own — a
// single line at this scale reads as a scratch on the silk
function leafCluster(x, y, s, ln, o, lit) {
  stroke(lerpColor(o.d, o.l, lit));
  strokeWeight(o.wt);
  line(x, y, x + s * ln * 0.72, y + ln * rr(0.28, 0.60));
  line(x, y, x + s * ln * 0.34, y - ln * rr(0.30, 0.55));
  if (random() < 0.5) line(x, y, x + s * ln * 0.95, y - ln * 0.10);
}

function mound(x, baseY, H, o) {
  const w = H * o.wide;

  // A body under the strokes. Without it the far shrubs are a scatter
  // of ticks with the water showing between them, which reads as dirt
  // on the pool rather than as a plant standing in it.
  noStroke();
  for (const [kw, kh, a] of [[1.00, 1.00, 92], [0.74, 0.78, 78], [0.48, 0.52, 66]]) {
    fill(alpha(o.d, a * o.solid));
    ellipse(x + rr(-w, w) * 0.16, baseY - H * 0.46 * kh,
      w * 1.9 * kw * rr(0.9, 1.06), H * 0.92 * kh * rr(0.9, 1.06));
  }

  // one or two woody stems showing under the skirt of the leaf
  stroke(o.bark);
  for (let i = 0, n = random() < 0.6 ? 2 : 1; i < n; i++) {
    strokeWeight(max(0.5, H * 0.055));
    line(x + rr(-w, w) * 0.25, baseY, x + rr(-w, w) * 0.2, baseY - H * rr(0.3, 0.5));
  }

  const n = max(6, round(lerp(7, 44, o.q)));
  for (let i = 0; i < n; i++) {
    const u = pow(random(), 0.72);              // packed toward the base
    const y = baseY - u * H;
    const s = random() < 0.5 ? -1 : 1;
    const px = x + s * moundHalf(w, u) * rr(0.12, 1.02);
    // light from the upper left, as on the bark and the flanks
    const lit = constrain(0.16 + 0.52 * u - 0.26 * s + rr(-0.18, 0.18), 0, 1);
    leafCluster(px, y, s, H * rr(0.11, 0.21), o, lit);
  }

  // a few tips carried past the silhouette, so the crown never closes
  // into the clean dome the shape function actually describes
  for (let i = 0, k = round(lerp(1, 5, o.q)); i < k; i++) {
    const s = random() < 0.5 ? -1 : 1;
    const u = rr(0.55, 1.0);
    const px = x + s * moundHalf(w, u) * rr(0.5, 1.0);
    stroke(lerpColor(o.d, o.l, rr(0.35, 0.9)));
    strokeWeight(o.wt * 0.8);
    line(px, baseY - u * H, px + s * H * 0.16, baseY - u * H - H * rr(0.10, 0.22));
  }
}

// The tiny-tree reading: a handful of stems off one root, leaf only
// on the outer half of each, so the base stays open and woody.
function sprig(x, baseY, H, o) {
  const w = H * o.wide;
  const stems = round(rr(3, 6));
  for (let i = 0; i < stems; i++) {
    const s = random() < 0.5 ? -1 : 1;
    const len = H * rr(0.62, 1.05);
    const p0 = { x: x + rr(-1, 1) * w * 0.14, y: baseY };
    const p2 = { x: x + s * w * rr(0.45, 1.1), y: baseY - len };
    const p1 = { x: x + s * w * 0.12, y: baseY - len * rr(0.5, 0.7) };

    stroke(o.bark);
    strokeWeight(max(0.5, H * 0.05));
    noFill();
    beginShape();
    for (let k = 0; k <= 8; k++) { const p = qp(p0, p1, p2, k / 8); vertex(p.x, p.y); }
    endShape();

    for (let t = 0.34, st = max(0.14, 2.0 / max(len, 1)); t <= 1.001; t += st) {
      const p = qp(p0, p1, p2, t);
      leafCluster(p.x, p.y, s, H * rr(0.10, 0.19), o,
        constrain(0.2 + 0.5 * t - 0.22 * s + rr(-0.15, 0.15), 0, 1));
    }
  }
}

// Sedge on a wet margin — blades, no mass. The one form that reads
// correctly standing in water, since there is nothing to it that the
// reflection has to account for.
function tuft(x, baseY, H, o) {
  const w = H * o.wide;
  const n = max(4, round(lerp(5, 16, o.q)));
  noFill();
  for (let i = 0; i < n; i++) {
    const s = random() < 0.5 ? -1 : 1;
    const len = H * rr(0.5, 1.1);
    const p0 = { x: x + rr(-1, 1) * w * 0.3, y: baseY };
    const p2 = { x: p0.x + s * w * rr(0.5, 1.4), y: baseY - len * rr(0.72, 1.0) };
    const p1 = { x: p0.x + s * w * 0.08, y: baseY - len * 0.85 };
    stroke(lerpColor(o.d, o.l, constrain(rr(0.1, 0.8) - 0.2 * s, 0, 1)));
    strokeWeight(o.wt * rr(0.7, 1.0));
    beginShape();
    for (let k = 0; k <= 7; k++) { const p = qp(p0, p1, p2, k / 7); vertex(p.x, p.y); }
    endShape();
  }
}

const FORMS = { mound, sprig, tuft };

// ------------------------------------------------------ the ground

function dryFoot(x, baseY, w, o) {
  noStroke();
  fill(P.ink[0], P.ink[1], P.ink[2], 20 * o.solid);
  ellipse(x, baseY + 0.6, w * 2.0, w * 0.42);
}

// Standing in the shallows: a squashed dark smudge for the reflection
// and a pale catch of light where the stem breaks the surface. Both
// go down before the plant, so its own base covers where they meet.
function wetFoot(x, baseY, H, w, o) {
  noStroke();
  fill(alpha(lerpColor(o.d, col(P.poolDeep), 0.45), 62 * o.solid));
  ellipse(x, baseY + H * 0.13, w * 1.7, H * 0.30);
  stroke(238, 246, 232, 80 * o.solid);
  strokeWeight(max(0.5, H * 0.045));
  line(x - w * 0.7, baseY, x + w * 0.7, baseY);
}

// One shrub rooted at (x, baseY), H tall. haze 0 near, 1 dissolved;
// wet plants it in the water rather than on the calcite.
export function paintShrub(kind, x, baseY, H, haze = 0, wet = false, gold = 0) {
  const o = pigment(haze, gold);
  o.q = constrain(H / 24, 0.1, 1);
  o.solid = 1 - haze;
  o.wide = kind === 'tuft' ? rr(0.42, 0.62) : rr(0.52, 0.78);
  o.wt = lerp(0.55, 1.0, o.q);

  push();
  strokeCap(ROUND);
  const w = H * o.wide;
  wet ? wetFoot(x, baseY, H, w, o) : dryFoot(x, baseY, w, o);
  (FORMS[kind] || mound)(x, baseY, H, o);
  pop();
}

// ------------------------------------------------------ the planting
// Planted off the pool outlines themselves rather than off the fan,
// because a shrub is small enough that half a pool-width of error
// puts it in open water — and a plant standing in the middle of a
// dish is the one thing that gives the terraces away as invented.
//
// Three sites, and the rim arc decides which is available. Indices
// run with the blob's own angle: the first half of the outline is
// the downhill front, where the flowstone wall drops away, and the
// second half is the uphill back, tucked under the row above.

// sedge likes its feet wet; woody scrub keeps to the dry calcite
function pickKind(wet) {
  const u = random();
  if (wet) return u < 0.55 ? 'tuft' : u < 0.85 ? 'sprig' : 'mound';
  return u < 0.48 ? 'mound' : u < 0.82 ? 'sprig' : 'tuft';
}

function site(p) {
  const n = p.pts.length;
  const roll = random();
  let j, inset, wet;
  if (roll < 0.50) {            // on the back rim, the dish standing behind it
    j = rr(0.54, 0.98); inset = rr(0.97, 1.04); wet = false;
  } else if (roll < 0.80) {     // the shallow margin, ankle-deep
    j = rr(0.48, 1.02); inset = rr(0.80, 0.93); wet = true;
  } else {                      // the front crest, spilling over the wall
    j = rr(0.07, 0.43); inset = rr(0.98, 1.03); wet = false;
  }
  const [px, py] = p.pts[floor(j * n) % n];
  return {
    x: p.cx + (px - p.cx) * inset,
    y: p.cy + (py - p.cy) * inset,
    wet,
  };
}

export function paintShrubs() {
  const stand = [];
  for (const p of placedPools()) {
    // Up at the valley head a shrub is under two pixels: a dark speck
    // on water that is meant to be dissolving into the mist, and a
    // rank of specks reads as grit rather than as growth.
    if (p.t < 0.16) continue;
    // Most dishes carry nothing at all. Scrub on every rim rings each
    // pool evenly and the terraces turn into flowerbeds — what sells
    // the calcite is that it is bare, with growth where it has managed
    // to get a root down and nowhere else.
    if (random() < 0.40) continue;
    // and where it does take, it takes in a clump
    let k = lerp(0.3, 1.9, p.t) * rr(0.3, 1.3);
    while (k-- > 0) {
      if (random() < 0.30) continue;
      const s = site(p);
      const kind = pickKind(s.wet);
      const H = lerp(4, 23, pow(p.t, 1.15)) * rr(0.62, 1.4) * (s.wet ? 0.82 : 1);
      const n = random() < 0.32 ? floor(rr(2, 4)) : 1;
      for (let i = 0; i < n; i++) {
        // companions crowd the first one, smaller and a touch behind
        const dx = i ? rr(-1, 1) * H * 1.1 : 0;
        const dy = i ? rr(-0.35, 0.2) * H : 0;
        const x = s.x + dx;
        if (x < -30 || x > width + 30) continue;
        stand.push({
          kind: i && random() < 0.5 ? pickKind(s.wet) : kind,
          x, y: s.y + dy, wet: s.wet,
          H: H * (i ? rr(0.45, 0.9) : 1),
          haze: constrain(p.hazeMix + rr(-0.05, 0.05), 0, 1),
          // the same ochre turn the stands on the bank are taking
          gold: p.hazeMix < 0.3 && random() < 0.16 ? rr(0.2, 0.45) : 0,
        });
      }
    }
  }
  // furthest up the valley first, so every shrub overlaps the one behind
  stand.sort((a, b) => a.y - b.y);
  for (const s of stand) paintShrub(s.kind, s.x, s.y, s.H, s.haze, s.wet, s.gold);
}
