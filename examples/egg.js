// https://homepages.gac.edu/~hvidsten/gex/gex-examples/projects/ovalExample/index.html
// This explains an egg is basiclly an intersection of 4 circles.
// We copy this method, but then do a revolution to bring it into 3D.

const { circle, half_space, preview } = require("../index");

// The egg is parameterized by it's bottom radius
const egg = (d) => {
  const r = d/2;
  const s2 = Math.sqrt(2);
  const topr = s2*s2*r-s2*r;

  const base = circle(d)
    .union(circle(topr*2).move([0, r, 0]));

  const eye = circle(d*2).move([-r, 0, 0])
    .intersection(circle(d*2).move([r, 0, 0]))

  const wing = eye.difference(base)
    .intersection(half_space([1,1,0]).move([0, r, 0]))
    .intersection(half_space([1,-1,0]).move([0, r, 0]));

  return base.union(wing)
    .intersection(half_space([1, 0, 0]))
    .revolveY();
};

preview(() => egg(0.5), [[-10, -10, -10], [10,10,10]], 5, 20);
