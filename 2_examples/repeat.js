const { box, sphere, cylinder, nothing, Viewer, repeatRadial } = require("../3_summonscript");

// Makes a clock-like shape
const result = repeatRadial(sphere(0.2).move([6.5, 0, 0]), 60)
  .union(repeatRadial(box.exact([0.5, 0.5, 0.5]).move([5.0, 0.0, 0]), 10))
  .union(cylinder(0.5, 14.0).move([0, 0, -0.5]))
  .union(cylinder(0.5, 5.0));

const bb = [[-10, -10, -10],[10,10,10]];
Viewer.upload(result, bb, 5, 10);
