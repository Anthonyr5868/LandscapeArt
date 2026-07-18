import { P, BASIN, col } from '../palette.js';

// ---------------------------------------- calcite basin under pools
export function paintBasin() {
  const top = height * BASIN;
  for (let y = top; y < height; y++) {
    const t = (y - top) / (height - top);
    const c = lerpColor(col(P.haze), col(P.travertine), constrain(t * 1.4, 0, 1));
    stroke(red(c), green(c), blue(c), lerp(60, 200, t));
    line(0, y, width, y);
  }
  strokeWeight(0.7);
  for (let k = 0; k < 260; k++) {
    const x = random(width);
    const y = random(top + 20, height);
    const t = (y - top) / (height - top);
    const len = random(4, 22) * (0.4 + t);
    stroke(P.rim[0], P.rim[1], P.rim[2], random(10, 34));
    line(x, y, x + random(-3, 3), y + len);
  }
}
