const { XYZ, box, halfSpace, sin, cos, Viewer } = require("../3_summonscript");

const wavey = (shape, frequency, amplitude) => {
  const [x,y,z] = XYZ();
  return shape.remap([x.add(cos(y.mul(frequency)).mul(amplitude)), y, z]);
};

const model = () => {
  return wavey(box.exact([10, 10, 10]), 2.5, 2.0)
    .union(
      wavey(halfSpace([-1, 0, 0]), 1.0, 0.5)
     .move([15, 0, 0])
    );
};

const r_1 = [20,20,20];
const region = [r_1.mul(-1), r_1];

Viewer.upload(model(), region, 1, 2);
