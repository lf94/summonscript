const { capsule,cone,cylinder,mm,deg,saveAsSTL } = require("../index");

const cap1 = capsule(10, 10).elongate([2, 0, 0]);
const cone1 = cone.elongated(10, 10, 5, [2, 0, 0])
const cyl1 = cylinder(10, 10);
const cyl2 = cylinder(10, 5);

const result = cone1
  .union(cap1.move([-30,0,0]))
  .union(cyl1.move([-15, 0, 0]))
  .union(cyl2.move([15, 0, 0]));

const res = 1.0;
const region = [45+2,45+2,45+2];
saveAsSTL(result,[region.mul(-1),region],1.0,"cone-vs-cylinder.stl");

