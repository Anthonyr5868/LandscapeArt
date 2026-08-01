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
import { paintTrees, paintTempleGrove } from './component/tree.js';
import { paintShrubs } from './component/shrub.js';
import { paintGrain } from './component/finish.js';
import { HEAD_X } from './palette.js';

const W = 1200, H = 820;
const SEED = 1113;

// Vegetation off for a before/after — stands, grove and pool scrub
// alike: load the page with ?trees=0
const SHOW_TREES = new URLSearchParams(location.search).get('trees') !== '0';

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

  // Flanking slopes, far pair then near pair, converging on the head.
  // Inner edges are written as offsets from HEAD_X so the whole notch
  // travels with it, slightly wider on the right to keep the gap from
  // closing on the temple. The left slope now has two thirds of the
  // canvas to lose its height in and the right one a third, which is
  // what turns a symmetrical V into a valley seen from off its axis.
  paintFlank(-1, 0.14, HEAD_X - 0.045, 0.50, 0.54, 11);   // far left
  paintFlank(1, 0.10, HEAD_X + 0.048, 0.48, 0.50, 23);   // far right
  paintFlank(-1, 0.30, HEAD_X - 0.105, 0.56, 0.17, 47);   // near left
  paintFlank(1, 0.26, HEAD_X + 0.115, 0.55, 0.15, 61);   // near right

  paintBasin();

  // forests on the banks, painted before the pools so the terraces
  // sit in front of them and the trees never float on the water
  if (SHOW_TREES) paintTrees();

  // the stand draws thousands of random strokes; reseed so everything
  // after it lands identically whether or not the trees were painted
  randomSeed(SEED + 1);
  noiseSeed(SEED + 1);

  paintPools();
  // scrub on the terraces themselves — after the pools, since it grows
  // out of rims that have to be down before anything can stand on them
  if (SHOW_TREES) paintShrubs();

  const TX = width * HEAD_X, TY = height * 0.548;
  paintTemple(TX, TY);
  // last, so the grove crosses in front of the hall it stands by
  if (SHOW_TREES) paintTempleGrove(TX, TY);

  paintMistBand();
  paintGrain();
}

// p5 global mode looks for setup/draw on window; module scope hides
// them, so hand them over explicitly
window.setup = setup;
window.draw = draw;
