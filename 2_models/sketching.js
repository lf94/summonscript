// Demonstrate how to use utils/sketch.js

const { box, circle, cylinder, deg, mm, Viewer, sketch, polar } = require("../3_summonscript");

const model = () => {
  return sketch({ startPoint: [0, 0] })
    .arc([1, 2], 0.5)
    .line([2, 0])
    .line([0, -2])
    .line([-2, 0])
    .done()
    .extrudeZ(0, 1*mm);
};

const region = [10*mm, 10*mm, 10*mm];

Viewer.upload(model(), [region.mul(-1).add(-1), region.add(1)], 1, 10);

