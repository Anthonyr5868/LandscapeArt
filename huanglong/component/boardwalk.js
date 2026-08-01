import { P, col } from '../palette.js';

// ------------------------------------------------------- boardwalk
// The plank walkway that carries visitors over the travertine — not a
// band laid across the view but the ground the viewer is standing on.
// Its railing enters at the left edge around two thirds down, falls
// away to the right, and leaves through the bottom at about three
// quarters of the width; everything below that line is deck, so the
// whole lower left corner of the picture is boards.
//
// That is the difference between a walkway in the painting and a
// painting seen from the walkway. A ribbon crossing the foreground is
// one more object among the pools; a plane running out of the bottom
// corner puts the viewer on it, and the terraces are then something
// being looked at over a rail rather than a pattern on the silk.
//
// Everything is built from a single line: the rail edge. Every
// measurement — plank pitch, post spacing, rail height, how much haze
// the wood has taken — is a multiple of the perspective scale at that
// point on it, so the boards open out toward the viewer without any of
// it being placed by hand. The deck's outer edge falls off the canvas
// the whole way along, which is the point: a near edge in shot would
// put a far side on the walk, and the walk is meant to have no far
// side. It is under the viewer's feet.
//
// The railing stands on the uphill edge only, which is where it is in
// the valley: the drop is on the water side.

// control points of the rail edge, in fractions of the canvas. Both
// ends are past the edge so the walk arrives from somewhere and leaves
// for somewhere, rather than beginning and ending in shot.
// The last point is well below the frame, not just past it: the rail
// rides RAIL px *above* this line, so a line that stops at the bottom
// edge leaves the handrail ending in mid-air over the pools.
const CTRL = [
  { x: -0.14, y: 0.585 },
  { x: 0.14, y: 0.690 },
  { x: 0.44, y: 0.850 },
  { x: 0.95, y: 1.320 },
];

// Where the boards go. They are perpendicular to the walk on the
// ground, but perpendicular on the ground is not perpendicular on the
// canvas: two directions at right angles in the world meet the horizon
// at two different points, and a board is only drawn square to the
// rail if the eye is directly above the deck looking down at it.
//
// The rail falls away to the right, so its own vanishing point is up
// and to the left — just past the left edge, as it happens. Its right
// angle is therefore a long way off to the right, which is what makes
// the boards come out nearly level. That is the whole difference
// between standing on the walk and hovering over it: from up here the
// boards lie flat across the bottom of the picture and only fan a
// little; drawn square to the rail they rake downhill, and the deck
// turns into a ramp propped against the valley.
const HORIZON = 0.50;           // as a fraction of canvas height
const VANISH = 1.55;            // ...and of its width, off to the right

const PLANK = 34;               // plank pitch, along the rail
const RAIL = 96;                // post height above the deck
const POST = 124;               // post spacing along the run
const N = 520;                  // samples along the line
const OVER = 70;                // how far past the frame a board is carried

const rr = (a, b) => random(a, b);

// a point d px out along the board standing on sample p
const at = (p, d) => [p.x + p.px * d, p.y + p.py * d];

function bez(k, u) {
  const v = 1 - u;
  return v * v * v * CTRL[0][k] + 3 * v * v * u * CTRL[1][k]
    + 3 * v * u * u * CTRL[2][k] + u * u * u * CTRL[3][k];
}

function bezD(k, u) {
  const v = 1 - u;
  return 3 * v * v * (CTRL[1][k] - CTRL[0][k]) + 6 * v * u * (CTRL[2][k] - CTRL[1][k])
    + 3 * u * u * (CTRL[3][k] - CTRL[2][k]);
}

// The walk is read off the same depth cue as everything else on the
// valley floor: how far down the canvas it has come. Keying the scale
// to y rather than to u means the deck agrees with the pools it
// crosses even though the two are laid out by different machinery.
function scaleAt(y) {
  return constrain(map(y, height * 0.55, height * 1.06, 0.55, 1.50), 0.45, 1.6);
}

function build() {
  const S = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = bez('x', u) * width, y = bez('y', u) * height;
    let dx = bezD('x', u) * width, dy = bezD('y', u) * height;
    const L = max(1e-6, sqrt(dx * dx + dy * dy));
    dx /= L; dy /= L;
    // Across the walk: straight away from the vanishing point the
    // boards run to, which is what lays them on the ground plane
    // instead of square to the rail.
    let px = x - width * VANISH, py = y - height * HORIZON;
    const M = max(1e-6, sqrt(px * px + py * py));
    px /= M; py /= M;
    // How far the board is carried: until it is off the canvas, by
    // whichever edge it leaves last. The deck has no near side in
    // shot — a board that stops short leaves a wedge of pool showing
    // through the floor, and taking the *later* of the two exits is
    // what keeps two neighbouring boards from cutting the corner
    // between them when one leaves by the side and one by the foot.
    const reach = max(px < 0 ? -x / px : 0, py > 0 ? (height - y) / py : 0) + OVER;
    const s = scaleAt(y);
    S.push({
      x, y, dx, dy, px, py, s, reach,
      nx: x + px * reach, ny: y + py * reach,
      // the far end of the run is up the valley and has to take a
      // little of the mist the pools up there are taking. Only a
      // little: the whole walk is foreground now, and wood a few
      // strides away that has already gone grey reads as painted fog.
      haze: constrain(map(s, 0.60, 1.05, 0.17, 0), 0, 0.20),
    });
  }
  return S;
}

// Weathered plank: bark warmed toward the travertine it lies on, since
// wood left out in this valley greys toward the stone rather than
// staying the brown of the trees it was cut from.
function pigment(haze) {
  const lit = lerpColor(col(P.barkLit), col(P.travertine), 0.54);
  const mid = lerpColor(col(P.barkLit), col(P.silkDark), 0.26);
  const dark = lerpColor(col(P.bark), col(P.ochre), 0.28);
  return {
    lit: lerpColor(lit, col(P.haze), haze),
    mid: lerpColor(mid, col(P.haze), haze),
    dark: lerpColor(dark, col(P.haze), haze),
    solid: 1 - haze,
  };
}

// ---------------------------------------------------------- the deck
// There is no near edge, no fascia and no piles: the deck runs off
// three sides of the frame, so the only part of the structure ever in
// shot is the walking surface and the rail standing on it. Anything
// built for the underside would draw itself somewhere nobody is
// looking, which is a strange thing to leave in a painting.

// Planks, laid across the run and pitched by arc length rather than by
// a fraction of it, so their spacing tightens with the perspective the
// same way the rows of pools do. Each one takes its own tone: a deck
// of a single colour is a painted plank, and what says wood at this
// size is that no two boards weathered alike.
function deck(S) {
  const seams = [];
  noStroke();

  // a base under the boards, so the hairline seams between them show
  // deck rather than pool
  fill(pigment(0.22).mid);
  beginShape();
  for (const p of S) vertex(p.x, p.y);
  for (let i = S.length - 1; i >= 0; i--) vertex(S[i].nx, S[i].ny);
  endShape(CLOSE);

  // A board is long enough here to weather unevenly down its own
  // length, so it is laid in three lengths across the deck rather than
  // as one flat tone. Whole-plank tone still does the work; this only
  // keeps a board the width of a hand from reading as a printed strip.
  //
  // Where those three lengths meet has to wander from board to board.
  // Cut them all at the same place and the joins line up down the
  // whole run into a hard seam travelling the length of the deck —
  // which is exactly the one thing a plank deck does not have.
  //
  // The cuts are measured in pixels along the board, not as fractions
  // of it: a board is carried until it leaves the frame, so its length
  // is whatever the canvas edge happened to ask for, and fractions of
  // that put both joins out of shot on the long ones.
  const cuts = (p, id) => [0,
    (95 + 55 * noise(id * 1.37, 21)) * p.s,
    (215 + 80 * noise(id * 1.37, 43)) * p.s,
    p.reach];

  let phase = 0, last = -1;
  for (let i = 0; i < S.length - 1; i++) {
    const a = S[i], b = S[i + 1];
    phase += dist(a.x, a.y, b.x, b.y) / max(2.2, PLANK * a.s);
    const id = floor(phase);
    const g = pigment(a.haze);
    // Sampled with a long stride. Walked at a tenth of a unit the
    // noise comes back nearly the same value board after board, and a
    // deck whose tone drifts smoothly across twenty planks is one
    // weathered board — the whole point is that they weathered apart.
    const tone = 0.18 + 0.76 * noise(id * 1.37);
    // carried a touch past its neighbour, or every board leaves a pale
    // seam of base colour down its trailing edge
    const e = 0.4, CA = cuts(a, id), CB = cuts(b, id);
    for (let c = 0; c < 3; c++) {
      fill(lerpColor(g.dark, g.lit,
        constrain(tone + (noise(id * 1.37, c * 3.7 + 5) - 0.5) * 0.30, 0, 1)));
      const [ax0, ay0] = at(a, CA[c]), [ax1, ay1] = at(a, CA[c + 1]);
      const [bx0, by0] = at(b, CB[c]), [bx1, by1] = at(b, CB[c + 1]);
      beginShape();
      vertex(ax0 - a.dx * e, ay0 - a.dy * e);
      vertex(bx0 + b.dx * e, by0 + b.dy * e);
      vertex(bx1 + b.dx * e, by1 + b.dy * e);
      vertex(ax1 - a.dx * e, ay1 - a.dy * e);
      endShape(CLOSE);
    }
    if (id !== last) { seams.push(a); last = id; }
  }

  // the gap between boards
  strokeCap(SQUARE);
  for (const p of seams) {
    stroke(P.ink[0], P.ink[1], P.ink[2], 46 * (1 - p.haze));
    strokeWeight(max(0.8, 1.7 * p.s));
    line(p.x, p.y, p.nx, p.ny);
  }

  // Grain: short marks lying inside a board, parallel to it and never
  // reaching either end. A board this wide is otherwise a flat field
  // of colour between two gaps, and a deck of them reads as painted
  // stripes rather than as sawn timber.
  for (const p of seams) {
    const pitch = PLANK * p.s;
    for (let k = 0, n = random() < 0.55 ? 2 : 1; k < n; k++) {
      const off = rr(0.22, 0.82) * pitch;
      const d0 = rr(10, 330) * p.s, d1 = d0 + rr(70, 190) * p.s;
      const [x0, y0] = at(p, d0), [x1, y1] = at(p, d1);
      stroke(P.ink[0], P.ink[1], P.ink[2], rr(10, 24) * (1 - p.haze));
      strokeWeight(max(0.6, 1.1 * p.s));
      line(x0 + p.dx * off, y0 + p.dy * off, x1 + p.dx * off, y1 + p.dy * off);
    }
  }

  // shade lying along the uphill edge, in under the rail
  noStroke();
  fill(P.ink[0], P.ink[1], P.ink[2], 22);
  beginShape();
  for (const p of S) vertex(p.x, p.y);
  for (let i = S.length - 1; i >= 0; i--) {
    const p = S[i];
    const [sx, sy] = at(p, 34 * p.s);
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// ------------------------------------------------------- the railing

function posts(S) {
  const rank = [];
  let run = POST;
  for (let i = 1; i < S.length; i++) {
    const a = S[i - 1], b = S[i];
    run += dist(a.x, a.y, b.x, b.y);
    if (run < POST * b.s) continue;
    run = 0;
    rank.push(b);
  }
  return rank;
}

// Post shadows falling across the deck, thrown down and to the right
// by the same upper-left light as the flanks and the bark. They are
// what fixes the railing onto the boards instead of behind them.
function railShadows(S, rank) {
  strokeCap(SQUARE);
  for (const p of rank) {
    if (p.s < 0.40) continue;
    stroke(P.ink[0], P.ink[1], P.ink[2], 40 * (1 - p.haze));
    strokeWeight(max(0.6, 6.5 * p.s));
    const len = RAIL * p.s * 0.62;
    line(p.x, p.y, p.x + len * 0.52, p.y + len * 0.44);
  }
  // the top rail's own shadow, a soft line running the length of the deck
  noFill();
  for (let i = 1; i < S.length; i++) {
    const a = S[i - 1], b = S[i];
    if (a.s < 0.40) continue;
    stroke(P.ink[0], P.ink[1], P.ink[2], 22 * (1 - a.haze));
    strokeWeight(max(0.6, 5.5 * a.s));
    const k = RAIL * 0.5;
    line(a.x + k * a.s * 0.52, a.y + k * a.s * 0.44,
      b.x + k * b.s * 0.52, b.y + k * b.s * 0.44);
  }
}

function railing(S, rank) {
  strokeCap(SQUARE);
  for (const p of rank) {
    const g = pigment(p.haze);
    stroke(lerpColor(g.dark, g.mid, 0.30));
    strokeWeight(max(0.8, 7.5 * p.s));
    // a hand-set post leans a little; a rank of true verticals reads
    // as a printed comb rather than as a fence somebody built
    line(p.x, p.y + 1, p.x + rr(-1, 1) * p.s * 3.2, p.y - RAIL * p.s);
  }

  // Two rails, drawn through the post tops after the posts so they
  // cross in front of them, as the real ones are bolted on the near
  // face. The lower one sits just over half way down, which is where
  // it lands on the walkways in the valley.
  noFill();
  strokeCap(ROUND);
  for (const [k, tone, wt] of [[1.0, 0.42, 6.5], [0.52, 0.30, 5.0]]) {
    for (let i = 1; i < S.length; i++) {
      const a = S[i - 1], b = S[i];
      const g = pigment(a.haze);
      stroke(lerpColor(g.dark, g.mid, tone));
      strokeWeight(max(0.7, wt * a.s));
      line(a.x, a.y - RAIL * a.s * k, b.x, b.y - RAIL * b.s * k);
    }
  }

  // light along the top of the handrail — the highest thing on the
  // walk and the only edge of it turned up at the sky
  for (let i = 1; i < S.length; i++) {
    const a = S[i - 1], b = S[i];
    stroke(240, 220, 178, 60 * (1 - a.haze));
    strokeWeight(max(0.5, 2.0 * a.s));
    const off = RAIL * 1.0;
    line(a.x, a.y - off * a.s - a.s * 2.4, b.x, b.y - off * b.s - b.s * 2.4);
  }
}

export function paintBoardwalk() {
  const S = build();
  const rank = posts(S);
  push();
  deck(S);
  railShadows(S, rank);
  railing(S, rank);
  pop();
}
