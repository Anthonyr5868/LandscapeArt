// ------------------------------------------------- grain + vignette
export function paintGrain() {
  const ctx = drawingContext;
  for (let y = 0; y < height; y += 3) {
    stroke(90, 70, 45, 5);
    line(0, y, width, y);
  }
  strokeWeight(1);
  for (let k = 0; k < 5200; k++) {
    const x = random(width), y = random(height);
    stroke(random() < 0.5 ? color(60, 45, 26, random(4, 14))
      : color(230, 208, 160, random(4, 12)));
    point(x, y);
  }
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, 'rgba(60,42,22,0.30)');
  g.addColorStop(0.10, 'rgba(60,42,22,0)');
  g.addColorStop(0.92, 'rgba(60,42,22,0)');
  g.addColorStop(1, 'rgba(60,42,22,0.30)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
  const gx = ctx.createLinearGradient(0, 0, width, 0);
  gx.addColorStop(0, 'rgba(60,42,22,0.26)');
  gx.addColorStop(0.04, 'rgba(60,42,22,0)');
  gx.addColorStop(0.96, 'rgba(60,42,22,0)');
  gx.addColorStop(1, 'rgba(60,42,22,0.26)');
  ctx.fillStyle = gx; ctx.fillRect(0, 0, width, height);
}
