const { box, sphere, cylinder, nothing, preview } = require("../index");
const repeat = require("../utils/repetition");

// Makes a clock-like shape
const result = repeat.radial(sphere(0.2).move([6.5, 0, 0]), 60)
.union(repeat.radial(box.exact([0.5, 0.5, 0.5]).move([5.0, 0.0, 0]), 10))
.union(cylinder(0.5, 14.0).move([0, 0, -0.5]))
.union(cylinder(0.5, 5.0));

const bb = [[-10, -10, -10],[10,10,10]];
preview(result, bb, 5, 10);
