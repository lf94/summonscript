const { box, sphere, Viewer } = require("../3_summonscript");

const model = () => {
  return box.exact([1, 1, 1])
  .unionBlend(sphere(1).move([0.75, 0, 0]), 1);
};

const r = [[-2,-2,-2], [2, 2, 2]];

Viewer.upload(model(), r, 1, 2**2);
