import { P, BASIN, col, css } from '../palette.js';

// ----------------------------------------------------- silk ground
export function paintSilk() {
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const c = lerpColor(col(P.silkDark), col(P.silk), 0.35 + 0.65 * t);
    stroke(c); line(0, y, width, y);
  }
  noStroke();
  for (let k = 0; k < 90; k++) {
    const x = random(width), y = random(height);
    const r = random(40, 190);
    const lighten = random() < 0.5;
    fill(lighten ? color(224, 198, 150, 7) : color(120, 92, 58, 6));
    ellipse(x, y, r * random(1, 2.4), r);
  }
  // drifting haze in the sky
  for (let k = 0; k < 4; k++) {
    const y = random(height * 0.04, height * 0.22);
    for (let dy = -14; dy <= 14; dy++) {
      const a = 13 * cos((dy / 14) * HALF_PI);
      stroke(P.haze[0], P.haze[1], P.haze[2], a);
      line(0, y + dy, width, y + dy);
    }
  }
}

// -------------------------------- distant peaks at the valley head
export function paintFarPeaks() {
  const ctx = drawingContext;
  const baseline = height * 0.455;
  const hazeMix = 0.74;
  for (let x = 0; x <= width; x += 2) {
    let r = 1 - abs(2 * noise(x * 0.006 + 300.5) - 1);
    r = pow(r, 2.1);
    const h = 115 * r * pow(noise(x * 0.0022 + 90.1), 1.5) + 6;
    const y0 = baseline - h;

    let peak = lerpColor(col(P.azurite), col(P.malachite), noise(x * 0.004 + 7.7));
    peak = lerpColor(peak, col(P.haze), hazeMix);
    // dissolve quickly: peaks floating on cloud, not a wall
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h * 0.9 + 12);
    g.addColorStop(0, peak.toString());
    g.addColorStop(0.65, css(P.haze, 0.85));
    g.addColorStop(1, css(P.haze, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, y0, 2, h * 0.9 + 12);
  }
}

// ------------------------- cloud sea hanging between the two flanks
export function paintCloudSea() {
  const yc = height * 0.46;
  for (let y = yc - 75; y <= yc + 60; y++) {
    const u = (y - (yc - 75)) / 135;
    const bell = sin(constrain(u, 0, 1) * PI);
    for (let x = 0; x < width; x += 4) {
      const wisp = noise(x * 0.004, y * 0.02);
      if (wisp < 0.32) continue;
      stroke(P.haze[0] + 10, P.haze[1] + 12, P.haze[2] + 14, 88 * bell * wisp);
      line(x, y, x + 4, y);
    }
  }
}

// -------------------------------- mist where basin meets mountains
export function paintMistBand() {
  const yc = height * BASIN;
  for (let dy = -34; dy <= 40; dy++) {
    const a = 40 * cos((dy / (dy < 0 ? 34 : 40)) * HALF_PI);
    stroke(P.haze[0], P.haze[1], P.haze[2], max(a, 0));
    line(0, yc + dy, width, yc + dy);
  }
}
