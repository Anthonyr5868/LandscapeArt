// palette — mineral pigments on aged silk
export const P = {
  silk: [199, 168, 118],
  silkDark: [170, 138, 92],
  azurite: [32, 92, 116],   // shiqing 石青
  malachite: [82, 138, 102],   // shilü 石绿
  ochre: [168, 126, 74],   // zheshi 赭石
  ink: [46, 52, 48],
  haze: [214, 190, 148],
  seal: [172, 48, 38],
  travertine: [210, 182, 130],
  rim: [178, 134, 74],
  poolPale: [150, 202, 180],
  poolMid: [64, 164, 152],
  poolDeep: [22, 110, 130],
};

export const BASIN = 0.55;              // where the valley floor begins

export function col(a, alpha = 255) { return color(a[0], a[1], a[2], alpha); }
export function css(a, alpha = 1) { return `rgba(${a[0]},${a[1]},${a[2]},${alpha})`; }
