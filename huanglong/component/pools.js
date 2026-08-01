import { P, col, HEAD_X } from '../palette.js';

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
// How much texture a thing at canvas height y is allowed: nothing
// above the middle distance, everything at the bottom edge. The eye
// reads detail up close and none of it far off, so ripples and rim
// highlights are rationed by this — spending strokes on a pool at the
// valley head only flattens its fade into the mist.
function detailAt(y) {
  return constrain(map(y, height * 0.70, height * 0.96, 0, 1), 0, 1);
}

function makePool(cx, cy, rx, ry, t) {
  return {
    cx, cy, rx, ry, t,
    k: random(1000),
    pts: blobPts(cx, cy, rx, ry, random(1000)),
    wallH: lerp(6, 46, t) * random(0.85, 1.2),
    // near water is read straight down into the deep pigment; far
    // water is shallow, pale, mostly the air standing over it
    deepBlend: constrain(random(0.45, 1) * lerp(0.62, 1.12, t), 0, 1),
    hazeMix: lerp(0.55, 0, pow(t, 0.62)),       // far pools dissolve
    det: detailAt(cy),
    w: lerp(3, 11, t),                           // rim ridge width
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
  // The terrace stands off the row below it, so the wall throws a
  // shadow onto that row — rows are painted near to far, which puts
  // each shadow down on ground that is already there. Only the near
  // rows get one worth seeing: at the valley head the step is a few
  // pixels tall and a shadow there just curdles the mist.
  ctx.shadowColor = `rgba(28,32,30,${lerp(0.03, 0.34, pow(t, 1.5))})`;
  ctx.shadowBlur = lerp(2, 15, t);
  ctx.shadowOffsetY = lerp(0.5, 5, t);
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
  const { pts, cx, cy, rx, ry, t, w, hazeMix, det, k } = p;
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

  // light caught on the crest of the front rim. The first detail to
  // be lost to distance, so it is held back for the front rank.
  if (det > 0.35) {
    noFill();
    stroke(246, 232, 196, 130 * (det - 0.35) / 0.65);
    strokeWeight(w * 0.30);
    beginShape();
    for (let j = floor(n * 0.08); j <= n * 0.42; j++) {
      const [px, py] = pts[j % n];
      curveVertex(px, py + w * 0.18);
    }
    endShape();
  }

  // Still-water ripples, kept well inside the rim and rationed by
  // detail: a far pool stays one flat plate of colour, which is what
  // sells the distance between it and the front rank.
  // They run parallel to the rim rather than flat across the dish —
  // a short arc of the pool's own outline, drawn in toward the centre
  // and wandered off true by noise, the way light bands on still water.
  if (det > 0.03) {
    const rows = round(lerp(1, 5, det));
    const amp = lerp(0.4, 2.8, det);
    noFill();
    strokeWeight(lerp(0.6, 1.15, det));
    for (let r = 0; r < rows; r++) {
      stroke(232, 242, 228, lerp(6, 60, det) * random(0.6, 1));
      const s = lerp(0.34, 0.86, (r + random(0.15, 0.85)) / rows);
      const j0 = floor(random(n));
      const j1 = j0 + floor(n * random(0.14, 0.32));
      beginShape();
      for (let j = j0; j <= j1; j++) {
        const [px, py] = pts[j % n];
        curveVertex(cx + (px - cx) * s,
          cy + (py - cy) * s + (noise(j * 0.3 + k) - 0.5) * amp);
      }
      endShape();
    }
  }
}

// The wedge of ground the terraces occupy, at row depth t — 0 at the
// valley head, 1 at the near edge. Exported because the forest is
// planted along these banks rather than scattered over the valley, and
// the two have to agree on where the water stops.
const RX = [132, 284];          // pool half-width, before perspective scale
const RY = [0.26, 0.33];        // ...as a fraction of it, dish being flat
const OVERHANG = 0.39;          // how far past hw the last rim carries on
const rxMean = (RX[0] + RX[1]) / 2;

// A dish on a ground plane is seen more nearly edge-on the further
// off it is, so the far rows flatten and the near rows open out.
const DISH = t => lerp(0.80, 1.16, t);

export function poolFan(t) {
  const sc = lerp(0.30, 1.86, t);                // perspective scale
  // fan opens wide enough that mid and near rows run edge to edge
  const hw = width * lerp(0.13, 0.80, pow(t, 0.85));
  return {
    sc, hw,
    y: lerp(height * 0.578, height * 0.995, pow(t, 1.28)),
    // The fan is hinged under the head and swings left as it comes
    // forward, so the terraces cross the canvas on a diagonal rather
    // than opening square at the viewer. The sine on top is the old
    // meander, kept so no two rows step down on the same line.
    cx: width * (lerp(HEAD_X - 0.012, 0.525, pow(t, 1.1)) + 0.03 * sin(t * 4.2 + 0.6)),
    // hw is where the last pool *starts*; its rim carries on past it
    edge: hw + rxMean * OVERHANG * sc,
    // y is the row's centre line — a dish reaches this much above it,
    // which is where the dry bank actually begins
    ry: rxMean * (RY[0] + RY[1]) / 2 * sc * DISH(t),
  };
}

// Every dish actually laid down, kept so the shrubs can be planted on
// real rims. The fan above says where the water is as a wedge; a plant
// small enough to stand on a single rim needs the outline itself.
let PLACED = [];
export function placedPools() { return PLACED; }

// pools fan out from the valley head toward the viewer,
// meandering slightly as the terraces step down
export function paintPools() {
  const rows = 6;
  PLACED = [];
  for (let i = rows - 1; i >= 0; i--) {
    const t = i / (rows - 1);                    // 0 = far, 1 = near
    const { y, cx: cxRow, sc, hw } = poolFan(t);

    const row = [];
    let x = cxRow - hw + random(-90, -30);       // start outside the fan
    while (x < cxRow + hw) {
      const rx = random(RX[0], RX[1]) * sc;
      const ry = rx * random(RY[0], RY[1]) * DISH(t);   // flat dishes: walls stay exposed
      if (random() < 0.02) { x += rx * random(1.15, 1.35); continue; }
      row.push(makePool(x + rx * 0.6, y + random(-0.35, 0.35) * ry, rx, ry, t));
      // the blob outline pulls in to 0.70 rx at its narrowest, so the
      // step has to stay under that or neighbours part and the basin
      // shows through between them
      x += rx * random(0.74, 0.98);
    }

    // walls first (same-row waters erase the lateral ones), then
    // water+rim interleaved so a later neighbour's water swallows
    // the overlapped stretch of the earlier rim — one shared ridge
    for (const p of row) poolWall(p);
    for (const p of row) { poolWater(p); poolRim(p); }
    PLACED.push(...row);
  }
}
