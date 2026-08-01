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
  bark: [46, 38, 30],   // wet dark trunk, keyed to ink
  barkLit: [92, 74, 54],   // ochre-touched sunlit bark
  leafDeep: [44, 96, 78],   // shadowed malachite foliage
  leafMid: [96, 148, 108],   // malachite canopy
  leafGold: [172, 130, 72],   // ochre autumn accents, ties to temple roof
};

export const BASIN = 0.55;              // where the valley floor begins

// The valley is seen off its own axis. Its head — and the temple
// standing at it — sits on the right third rather than dead centre,
// which leaves a long shallow slope on the left and a short steep one
// on the right, and lets the terraces sweep down and away to the left
// instead of opening symmetrically at the viewer. A centred view of a
// symmetrical valley is the one arrangement that reads as a diagram.
// Everything that converges on the head is written against this.
export const HEAD_X = 2 / 3;

export function col(a, alpha = 255) { return color(a[0], a[1], a[2], alpha); }
export function css(a, alpha = 1) { return `rgba(${a[0]},${a[1]},${a[2]},${alpha})`; }
