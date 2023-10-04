const { preview } = require("../utils/preview");
const { saveAsSTL, deg, box, half_space, X, Y, Z, sin, cos } = require("../index");

const wavey = (shape, frequency, amplitude) => {
  const [x,y,z] = [X(), Y(), Z()];
  return shape.remap(x.add(cos(y.mul(frequency)).mul(amplitude)), y, z);
};

const result = 
  wavey(box.exact([10, 10, 10]), 2.5, 2.0)
  .union(wavey(half_space([-1, 0, 0]), 1.0, 0.5).move([15, 0, 0]));

const r_1 = [20,20,20];
const region = [r_1.mul(-1), r_1];
preview(result, region, 1, 4);
// saveAsSTL(result, region, 4, "wavey.stl");

