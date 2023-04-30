const { cylinder, mm, saveAsSTL } = require("../index");

saveAsSTL(cylinder(10*mm, 20*mm), [[-20*mm, -20*mm, -20*mm], [20*mm, 20*mm, 20*mm]], 1.0, "cylinder.stl");
