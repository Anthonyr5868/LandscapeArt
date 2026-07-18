import { P } from '../palette.js';

// --------------------------------------------------------- temple
export function paintTemple(x, y) {
    const w = 96, wall = 22, base = 6;
    const jade = [104, 142, 118];

    const lerp3 = (a, b, c, u) => {  // point on a quadratic bezier
        const v = 1 - u;
        return v * v * a + 2 * v * u * b + u * u * c;
    };

    function paintRoof(cx, ry, hw, ch, tip) {
        // solid golden tile face, sags onto the wall, upturned tips
        noStroke();
        fill(P.ochre[0] - 18, P.ochre[1] - 22, P.ochre[2] - 20, 235);
        beginShape();
        vertex(cx - hw, ry - tip);
        quadraticVertex(cx - hw * 0.5, ry + 2, cx, ry - ch);
        quadraticVertex(cx + hw * 0.5, ry + 2, cx + hw, ry - tip);
        quadraticVertex(cx + hw * 0.5, ry + 7, cx, ry + 1);
        quadraticVertex(cx - hw * 0.5, ry + 7, cx - hw, ry - tip);
        endShape(CLOSE);

        // tile courses
        stroke(P.ochre[0] - 70, P.ochre[1] - 70, P.ochre[2] - 55, 150);
        strokeWeight(0.7);
        for (let side = -1; side <= 1; side += 2) {
            for (let u = 0.18; u <= 0.92; u += 0.15) {
                const px = lerp3(cx + side * hw, cx + side * hw * 0.5, cx, u);
                const py = lerp3(ry - tip, ry + 2, ry - ch, u);
                line(px, py + 1.2, px, py + 4.2);
                if (u > 0.4) line(px, py + 6, px, py + 9);
            }
        }

        // ink eave line + tip flicks
        noFill();
        stroke(P.ink[0], P.ink[1], P.ink[2], 170);
        strokeWeight(0.9);
        beginShape();
        vertex(cx - hw, ry - tip);
        quadraticVertex(cx - hw * 0.5, ry + 2, cx, ry - ch);
        quadraticVertex(cx + hw * 0.5, ry + 2, cx + hw, ry - tip);
        endShape();
        strokeWeight(1.4);
        line(cx - hw, ry - tip, cx - hw - 2.5, ry - tip - 3);
        line(cx + hw, ry - tip, cx + hw + 2.5, ry - tip - 3);
    }

    // stone platform + steps
    noStroke();
    fill(P.silk[0] - 20, P.silk[1] - 20, P.silk[2] - 20, 210);
    rect(x - w * 0.5, y - base, w, base);
    fill(P.silk[0] - 38, P.silk[1] - 38, P.silk[2] - 34, 210);
    rect(x - 9, y - base, 18, base);
    const y0 = y - base;

    // red hall wall + door bays + columns
    fill(P.seal[0] - 34, P.seal[1] - 14, P.seal[2] - 12, 235);
    rect(x - w * 0.36, y0 - wall, w * 0.72, wall);
    fill(P.ink[0], P.ink[1], P.ink[2], 220);
    for (let c = -1; c <= 1; c++)
        rect(x + c * w * 0.2 - 5.5, y0 - wall * 0.62, 11, wall * 0.62);
    fill(P.seal[0], P.seal[1], P.seal[2]);
    for (let c = 0; c < 4; c++)
        rect(x - w * 0.3 + c * w * 0.2 - 1.2, y0 - wall, 2.4, wall);

    // gold banner strip with fringe
    fill(P.ochre[0], P.ochre[1], P.ochre[2], 230);
    rect(x - w * 0.3, y0 - wall * 0.78, w * 0.6, 3);
    stroke(P.ochre[0], P.ochre[1], P.ochre[2], 200);
    strokeWeight(0.6);
    for (let fx = -w * 0.29; fx <= w * 0.29; fx += 2.4)
        line(x + fx, y0 - wall * 0.78 + 3, x + fx, y0 - wall * 0.78 + 5);

    // clerestory BEHIND the lower roof — base sunk so the roof covers it
    const ry1 = y0 - wall - 2.5;
    const cw = w * 0.24, yt = ry1 - 21;
    noStroke();
    fill(P.seal[0] - 34, P.seal[1] - 14, P.seal[2] - 12, 235);
    rect(x - cw, yt, cw * 2, 21);
    fill(P.seal[0], P.seal[1], P.seal[2]);
    rect(x - cw, yt, 2, 21);
    rect(x + cw - 2, yt, 2, 21);
    fill(P.ochre[0], P.ochre[1], P.ochre[2], 240);
    rect(x - 2.5, yt + 3, 5, 7);

    // lower roof sweeps unbroken in front, jade trim caps the wall seam
    paintRoof(x, ry1, w * 0.62, 10, 6);
    noStroke();
    fill(jade[0], jade[1], jade[2], 220);
    rect(x - w * 0.38, ry1, w * 0.76, 2.5);

    // upper roof + its jade trim
    const ry2 = yt - 2.5;
    paintRoof(x, ry2, w * 0.44, 13, 7);
    noStroke();
    fill(jade[0], jade[1], jade[2], 220);
    rect(x - cw - 3, ry2, cw * 2 + 6, 2.5);

    // ridge crest with curled ends + spire finial
    fill(P.ink[0], P.ink[1], P.ink[2], 210);
    rect(x - w * 0.06, ry2 - 15.5, w * 0.12, 3);
    triangle(x - w * 0.06, ry2 - 15.5, x - w * 0.06, ry2 - 19.5, x - w * 0.06 + 2.5, ry2 - 15.5);
    triangle(x + w * 0.06, ry2 - 15.5, x + w * 0.06, ry2 - 19.5, x + w * 0.06 - 2.5, ry2 - 15.5);
    rect(x - 2.2, ry2 - 18.5, 4.4, 3);
    rect(x - 1.5, ry2 - 21, 3, 2.5);
    fill(P.seal[0], P.seal[1], P.seal[2], 220);
    rect(x - 0.8, ry2 - 23.5, 1.6, 2.5);
}
