// Demonstrate how to use lib/sketch.js

const { cylinder, deg, mm, saveAsSTL } = require("../index");
const { sketch, polar } = require("../lib/sketch2");

const cubeSketched = sketch({ startPoint: [0, 0] })
  .line(polar(5*mm, 90*deg))
  .line(polar(5*mm, 0*deg))
  .line(polar(5*mm, -90*deg))
  .line(polar(5*mm, 180*deg))
  .done()
  .extrudeZ(0, 5*mm);

const region = [10*mm, 10*mm, 10*mm];
console.log(cubeSketched.reify());
saveAsSTL(cubeSketched, [region.mul(-1), region], 1.0, "sketching.stl");

