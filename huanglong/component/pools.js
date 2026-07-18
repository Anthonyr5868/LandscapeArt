import { P, col } from '../palette.js';

// ------------------------------------------------- terraced pools
function blobPts(cx, cy, rx, ry, k) {
  const pts = [];
  const n = 48;
  for (let j = 0; j < n; j++) {
    const a = TWO_PI * j / n;
    const w = 0.70 + 0.58 * noise(cos(a) * 1.25 + k, sin(a) * 1.25 + k * 1.7);
    pts.push([cx + cos(a) * rx * w, cy + sin(a) * ry * w]);
  }
  return pts;
}

function blobShape(pts, scale = 1, cx = 0, cy = 0, dy = 0) {
  beginShape();
  for (let j = 0; j < pts.length + 3; j++) {
    const [px, py] = pts[j % pts.length];
    curveVertex(cx + (px - cx) * scale, cy + (py - cy) * scale + dy);
  }
  endShape(CLOSE);
}

// Pools are painted in three passes per row (walls, then waters,
// then rims) with rows stacked near to far. Same-row neighbours
// erase each other's lateral walls, so walls survive only along the
// row's downhill front — each terrace steps visibly onto the row
// below without any pool reading as a floating disc.
function makePool(cx, cy, rx, ry, t) {
  return {
    cx, cy, rx, ry, t,
    k: random(1000),
    pts: blobPts(cx, cy, rx, ry, random(1000)),
    wallH: lerp(4, 30, t) * random(0.85, 1.2),
    deepBlend: random(0.45, 1),
    hazeMix: lerp(0.42, 0, pow(t, 0.8)),        // far pools dissolve
    w: lerp(2.5, 9, t),                          // rim ridge width
  };
}

// pass 1 — flowstone wall dropping from the downhill edge
function poolWall(p) {
  const ctx = drawingContext;
  const { pts, cy, ry, t, k, wallH, hazeMix } = p;
  const n = pts.length;
  const wallTop = lerpColor(color(P.rim[0] + 34, P.rim[1] + 30, P.rim[2] + 20, 245), col(P.haze), hazeMix);
  const wallBot = lerpColor(color(P.rim[0] - 58, P.rim[1] - 50, P.rim[2] - 36, 245), col(P.haze), hazeMix);
  const j0 = floor(n * 0.04), j1 = ceil(n * 0.46);
  const foot = [];
  ctx.save();
  ctx.beginPath();
  for (let j = j0; j <= j1; j++) {
    const [px, py] = pts[j % n];
    j === j0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  for (let j = j1; j >= j0; j--) {
    const [px, py] = pts[j % n];
    const h = wallH * (0.7 + 0.6 * noise(px * 0.05, k * 2.3));
    foot.push([px, py + h]);
    ctx.lineTo(px, py + h);
  }
  ctx.closePath();
  const wg = ctx.createLinearGradient(0, cy + ry * 0.55, 0, cy + ry + wallH);
  wg.addColorStop(0, wallTop.toString());
  wg.addColorStop(1, wallBot.toString());
  ctx.fillStyle = wg;
  ctx.fill();
  ctx.restore();

  // contact shadow grounding the wall on the terrace below
  noFill();
  stroke(P.ink[0], P.ink[1], P.ink[2], lerp(16, 52, t));
  strokeWeight(lerp(0.8, 1.6, t));
  beginShape();
  for (const [px, py] of foot) curveVertex(px, py + 0.5);
  endShape();

  // drip texture running down the wall
  if (t > 0.25) {
    stroke(P.rim[0] - 30, P.rim[1] - 28, P.rim[2] - 20, 70);
    strokeWeight(0.6);
    for (let j = j0; j <= j1; j += 2) {
      const [px, py] = pts[j % n];
      if (random() < 0.6) line(px, py + 1, px + random(-1.5, 1.5), py + wallH * random(0.5, 0.9));
    }
  }
}

// pass 2 — water: smooth radial gradient, pale edge to deep centre
function poolWater(p) {
  const ctx = drawingContext;
  const { pts, cx, cy, rx, ry, deepBlend, hazeMix } = p;
  const deepC = lerpColor(lerpColor(col(P.poolMid), col(P.poolDeep), deepBlend), col(P.haze), hazeMix);
  const midC = lerpColor(lerpColor(col(P.poolMid), col(P.poolPale), 0.3), col(P.haze), hazeMix);
  const paleC = lerpColor(col(P.poolPale), col(P.haze), hazeMix);
  ctx.save();
  ctx.beginPath();
  for (let j = 0; j < pts.length; j++) {
    j ? ctx.lineTo(pts[j][0], pts[j][1]) : ctx.moveTo(pts[j][0], pts[j][1]);
  }
  ctx.closePath();
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, -rx * 0.14, rx * 0.05, 0, -rx * 0.14, rx * 1.18);
  g.addColorStop(0.00, deepC.toString());
  g.addColorStop(0.55, midC.toString());
  g.addColorStop(0.88, paleC.toString());
  g.addColorStop(1.00, paleC.toString());
  ctx.fillStyle = g;
  ctx.fillRect(-rx * 1.6, -rx * 1.6, rx * 3.2, rx * 3.2);
  ctx.restore();
}

// pass 3 — recessed-water shadow, calcite ridge, ripples
function poolRim(p) {
  const { pts, cx, cy, rx, ry, t, w, hazeMix } = p;
  const n = pts.length;

  // the water sits recessed: a shadow tucked under the uphill rim
  noFill();
  stroke(P.ink[0], P.ink[1] + 8, P.ink[2] + 6, lerp(18, 42, t));
  strokeWeight(w * 1.1);
  beginShape();
  for (let j = floor(n * 0.56); j <= n * 0.94; j++) {
    const [px, py] = pts[j % n];
    curveVertex(px, py + w * 0.55);
  }
  endShape();

  // calcite ridge straddling the water's edge: pale bed, golden
  // crest, then the painter's ink line
  stroke(lerpColor(color(226, 200, 148, 240), col(P.haze), hazeMix));
  strokeWeight(w);
  blobShape(pts, 1.0, cx, cy);

  stroke(lerpColor(color(P.rim[0], P.rim[1], P.rim[2], 190), col(P.haze), hazeMix));
  strokeWeight(w * 0.45);
  blobShape(pts, 1.0, cx, cy);

  stroke(P.ink[0], P.ink[1], P.ink[2], lerp(26, 70, t));
  strokeWeight(lerp(0.5, 1.0, t));
  blobShape(pts, 1.0, cx, cy);

  // still-water ripples, kept well inside the rim
  stroke(230, 240, 226, lerp(24, 52, t));
  strokeWeight(0.7);
  for (let r = 0; r < 3; r++) {
    const yy = cy + random(-0.25, 0.3) * ry;
    const half = rx * random(0.18, 0.42);
    line(cx - half, yy, cx + half, yy + random(-0.8, 0.8));
  }
}

// pools fan out from the valley head toward the viewer,
// meandering slightly as the terraces step down
export function paintPools() {
  const rows = 7;
  for (let i = rows - 1; i >= 0; i--) {
    const t = i / (rows - 1);                    // 0 = far, 1 = near
    const y = lerp(height * 0.578, height * 0.995, pow(t, 1.28));
    const sc = lerp(0.36, 2.0, t);               // perspective scale
    // fan opens wide enough that mid and near rows run edge to edge
    const hw = width * lerp(0.13, 0.80, pow(t, 0.85));
    const cxRow = width * (0.5 + 0.04 * sin(t * 4.2 + 0.6));

    const row = [];
    let x = cxRow - hw + random(-30, 10);
    while (x < cxRow + hw) {
      const rx = random(55, 140) * sc;
      const ry = rx * random(0.24, 0.31);        // flat dishes: walls stay exposed
      if (random() < 0.05) { x += rx * random(1.3, 1.7); continue; }
      row.push(makePool(x + rx * 0.6, y + random(-0.35, 0.35) * ry, rx, ry, t));
      x += rx * random(0.75, 1.15);              // rims merge into one sheet
    }

    // walls first (same-row waters erase the lateral ones), then
    // water+rim interleaved so a later neighbour's water swallows
    // the overlapped stretch of the earlier rim — one shared ridge
    for (const p of row) poolWall(p);
    for (const p of row) { poolWater(p); poolRim(p); }
  }
}
