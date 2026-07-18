# landscape art

Generative landscape paintings in [p5.js](https://p5js.org/), in the manner of Song-dynasty blue-green (qinglü 青绿) shanshui.

Each sketch is a single self-contained HTML file. Open it in a browser and click the canvas to repaint with a new seed.

## Sketches

| Sketch | Subject |
| --- | --- |
| [`wang-ximeng-landscape.html`](wang-ximeng-landscape.html) | After *A Thousand Li of Rivers and Mountains* (Wang Ximeng, 1113): layered azurite-and-malachite peaks on aged silk, mist bands, ripple-lined water, tiny trees and boats |
| [`huanglong/huanglong-static.html`](huanglong/huanglong-static.html) | Yellow Dragon Pools, Huanglong: a still blue-green valley view with terraced travertine pools and a small temple |

## How they work

- **Ridgelines** — ridged Perlin noise (`1 - abs(2 * noise(x) - 1)`, raised to a power) for sharp clustered peaks, shaped by a low-frequency envelope that decides where ranges rise and fall away
- **Pigment gradients** — per-column canvas linear gradients so color pools at the ridgeline (azurite/malachite) and dissolves down through ochre into the silk ground, the way mineral washes behave on silk
- **Atmosphere** — distant ranges lerped toward a haze color; translucent mist bands pooling at each range's base
- **Water** — broken horizontal ripple strokes (river scroll), or a 2D-noise color field blending deep teal → turquoise → jade → pale cyan for the travertine pools
- **Finish** — silk-weave grain, speckle, darkened scroll edges, and a vermilion collector's seal

## Running locally

No build step. Either open the HTML files directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

`index.html` is a small gallery page linking the sketches — enable GitHub Pages on the repo (Settings → Pages → deploy from branch) to host it.

p5.js is loaded from cdnjs, so an internet connection is required.
