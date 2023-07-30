// Demonstrate how to use lib/sketch.js

const { deg, mm, saveAsSTL } = require("../index");
const { sketch, polar } = require("../lib/sketch");

const cubeSketched = sketch({ startPoint: [0, 0] })
  .line(polar(6*mm, 90*deg))
  .line(polar(6*mm, 0*deg))
  .line(polar(6*mm, -90*deg))
  .line(polar(6*mm, 180*deg))
  .done()
  .extrudeZ(0, 6*mm);

const region = [10*mm, 10*mm, 10*mm];
saveAsSTL(cubeSketched, [region.mul(-1), region], 0.1, "sketching.stl");

