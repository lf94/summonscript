const { preview } = require("../utils/preview");
const { box, sphere } = require("../index");

const model = () => {
  return box.exact([1, 1, 1])
  .blend(sphere(1).move([0.75, 0, 0]), 1);
};

const r = [[-2,-2,-2], [2, 2, 2]];

preview(model, r, 1, 2**2);
