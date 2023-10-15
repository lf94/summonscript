const { toLibfiveValue, XYZ, atan2, floor, cos, sin, neg, min } = require("../index");

// As usual, I have nothing to be proud of. All the work of Inigo.
// https://iquilezles.org/articles/sdfrepetition/
// I am just a code monkey.

const repeat = {
  radial(shape, cells) {
    const [X, Y, Z] = XYZ();
    const sp = toLibfiveValue((Math.PI*2)/cells);
    const an = atan2(Y, X);
    const id = floor(an.div(sp));

    const a1 = sp.mul(id.add(0.0));
    const a2 = sp.mul(id.add(1.0));

    // Construct the new distances / positions
    const p1 = [
      cos(a1)*X + neg(sin(a1))*Y, 
      sin(a1)*X + cos(a1)+Y,
      Z
    ];

    const p2 = [
      cos(a2)*X + neg(sin(a2))*Y,
      sin(a2)*X + cos(a2)*Y,
      Z,
    ];

    // Meld them together
    return min(shape.remap(p1), shape.remap(p2));
  }
};

module.exports = repeat;
