const { length, toLibfiveValue, XYZ, atan2, floor, cos, sin, neg, min } = require("../index");

// https://iquilezles.org/articles/sdfrepetition/
// I am just a code monkey.

const repeat = {
  // You'll want to use this more often than not.
  radial(shape, cells) {
    const [X, Y, Z] = XYZ();
    const sp = (Math.PI*2)/cells;
    const an = atan2(Y, X);
    const id = floor(an.div(sp));

    const a1 = id.add(0.0).mul(sp);
    const a2 = id.add(1.0).mul(sp);

    // Construct the new distances / positions
    const p1 = [
      cos(a1).mul(X).sub(neg(sin(a1)).mul(Y)), 
      sin(a1).mul(X).sub(cos(a1).mul(Y)),
      Z
    ];

    const p2 = [
      cos(a2).mul(X).sub(neg(sin(a2)).mul(Y)),
      sin(a2).mul(X).sub(cos(a2).mul(Y)),
      Z,
    ];

    // Meld them together
    return min(shape.remap(p1), shape.remap(p2));
  },

  // Cheaper but causes bad SDF at the edges.
  radialCheaper(sdf, cells) {
    const [X, Y, Z] = XYZ();
    // naive domain repetition
    const b = (Math.PI*2)/cells;
    const a = atan2(Y, X);
    const i = floor(a.div(b).add(0.5)); // equiv. to round()

    const c = i.mul(b);
    const p = [
      X.mul(cos(c)).sub(Y.mul(neg(sin(c)))),
      X.mul(sin(c)).sub(Y.mul(cos(c))),
      Z,
    ];
    
    // evaluate a single SDF
    return sdf.remap(p);
  },

  // From mkeeter's libfive-stdlib
  // Avoid this at all costs. In comparison the other 2 can do infinite
  // amount of radial repetitions...
  radialUnion(shape, cells) {
    const a = (2 *Math.PI)/cells;
    for (let i=1; i < cells; ++i) {
      shape = min(shape, shape.rotateZ(i*a));
    }
    return shape;
  }
};

module.exports = repeat;
