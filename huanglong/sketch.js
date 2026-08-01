// ---------------------------------------------------------------
// A single fixed composition of the Huanglong valley, painted in
// blue-green (qinglü) mineral pigments: forested slopes flank a
// misty basin; the temple sits at its head; terraced turquoise
// pools fan toward the viewer. Deterministic — one view, held.
// ---------------------------------------------------------------

import { paintSilk, paintFarPeaks, paintCloudSea, paintMistBand } from './component/atmosphere.js';
import { paintFlank } from './component/flank.js';
import { paintBasin } from './component/basin.js';
import { paintPools } from './component/pools.js';
import { paintTemple } from './component/temple.js';
import { paintTrees } from './component/tree.js';
import { paintGrain } from './component/finish.js';

const W = 1200, H = 820;
const SEED = 1113;

function setup() {
  const c = createCanvas(W, H);
  c.parent('holder');
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  noLoop();
}

function draw() {
  randomSeed(SEED);
  noiseSeed(SEED);

  paintSilk();
  paintFarPeaks();
  paintCloudSea();

  // flanking slopes, far pair then near pair, converging on the valley
  paintFlank(-1, 0.14, 0.46, 0.50, 0.42, 11);   // far left
  paintFlank(1, 0.10, 0.55, 0.48, 0.38, 23);   // far right
  paintFlank(-1, 0.30, 0.40, 0.56, 0.10, 47);   // near left
  paintFlank(1, 0.26, 0.62, 0.55, 0.08, 61);   // near right

  paintBasin();

  // forests on the banks, painted before the pools so the terraces
  // sit in front of them and the trees never float on the water
  paintTrees();

  paintPools();
  paintTemple(width * 0.50, height * 0.548);

  paintMistBand();
  paintGrain();
}

// p5 global mode looks for setup/draw on window; module scope hides
// them, so hand them over explicitly
window.setup = setup;
window.draw = draw;
