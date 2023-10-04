const { preview } = require("../utils/preview");
const { box, sphere } = require("../index");

const b = box.exact([1, 1, 1])
  .blend(sphere(1).move([0.5, 0, 0]), 1);

const r = [[-2,-2,-2], [2, 2, 2]];
preview(() => b, r, 1, 2**2);
