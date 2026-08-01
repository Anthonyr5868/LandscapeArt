import { P, col, css } from '../palette.js';

// ------------------------------------------------- flanking slope
// side: -1 left, +1 right. Ridge falls from the canvas edge
// (yEdge, fraction of H) to the valley at (xInner, yInner).
export function paintFlank(side, yEdge, xInner, yInner, hazeMix, k) {
  const ctx = drawingContext;
  const xEdge = side < 0 ? 0 : width;
  const xi = width * xInner;
  const span = abs(xi - xEdge);
  const baseline = height * 0.66;

  const ridge = new Float32Array(width + 1).fill(NaN);
  for (let x = 0; x <= width; x++) {
    const p = abs(x - xEdge) / span;            // 0 at edge, 1 at valley
    if (p > 1.55) continue;
    // past the valley end the spur keeps diving, sinking under
    // the basin mist instead of stopping in a hard seam
    const spine = p <= 1
      ? lerp(height * yEdge, height * yInner, pow(p, 1.25))
      : lerp(height * yInner, height * 0.78, (p - 1) / 0.55);
    let r = 1 - abs(2 * noise(x * 0.006 + k * 113.3) - 1);
    r = pow(r, 1.6);
    let r2 = 1 - abs(2 * noise(x * 0.016 + k * 71.9) - 1);
    r2 = pow(r2, 1.8);
    const amp = lerp(95, 5, constrain(pow(p, 0.75), 0, 1));
    ridge[x] = spine - (r + 0.45 * r2) * amp - noise(x * 0.02 + k * 3.1) * 16;
  }

  // Per-column pigment gradient down the face. Stepped one pixel at a
  // time, overlapping slightly: off-axis the right-hand slope has to
  // lose its whole height in a third of the canvas, and at that pitch
  // a two-pixel column turns the ridge into a visible staircase.
  for (let x = 0; x <= width; x += 1) {
    if (isNaN(ridge[x])) continue;
    const y0 = ridge[x];
    if (baseline - y0 < 2) continue;

    const blend = noise(x * 0.0035 + k * 19.7);
    let peak = lerpColor(col(P.azurite), col(P.malachite), blend);
    peak = lerpColor(peak, col(P.haze), hazeMix);
    const mid = lerpColor(col(P.ochre), col(P.haze), hazeMix * 0.8);

    const fade = baseline - y0 + 50;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + fade);
    g.addColorStop(0.00, peak.toString());
    g.addColorStop(0.55, css([red(mid), green(mid), blue(mid)], 1));
    g.addColorStop(0.84, css(P.silk, 1));
    g.addColorStop(1.00, css(P.silk, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, y0, 1.5, fade);
  }

  // ink contour along the ridge
  const near = hazeMix < 0.2;
  strokeWeight(near ? 1.1 : 0.7);
  stroke(P.ink[0], P.ink[1], P.ink[2], near ? 85 : 34);
  noFill();
  beginShape();
  for (let x = 0; x <= width; x += 2) {
    if (!isNaN(ridge[x])) vertex(x, ridge[x]);
  }
  endShape();

  // cun 皴 strokes, short and quiet, hugging the ridge
  stroke(P.ink[0], P.ink[1], P.ink[2], near ? 24 : 10);
  strokeWeight(0.6);
  for (let x = 6; x < width - 6; x += 5) {
    if (isNaN(ridge[x])) continue;
    const hHere = baseline - ridge[x];
    if (hHere > 40 && random() < 0.5) {
      const len = random(6, min(hHere * 0.25, 26));
      line(x, ridge[x] + 3, x + random(-3, 3), ridge[x] + 3 + len);
    }
  }

  // mist licking the base of the slope
  const mistTop = baseline - 40;
  for (let y = mistTop; y < baseline + 20 && y < height; y++) {
    const a = 34 * sin(map(y, mistTop, baseline + 20, 0, PI));
    stroke(P.haze[0], P.haze[1], P.haze[2], a);
    line(0, y, width, y);
  }
}
