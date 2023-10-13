// Demonstrate how to use utils/sketch.js

const { box, cylinder, deg, mm, preview } = require("../index");
const { sketch, polar } = require("../utils/sketch");

const model = () => {
  return sketch({ startPoint: [0, 0] })
    .line(polar(5*mm, 60*deg))
    .line(polar(5*mm, -60*deg))
    .line(polar(5*mm, -180*deg))
    .done()
    .extrudeZ(0, 5*mm);
};

const region = [50*mm, 50*mm, 50*mm];

preview(model, [region.mul(-1).add(-0.5), region.add(0.5)], 0.1, 0.4);

