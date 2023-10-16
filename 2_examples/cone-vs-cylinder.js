const { capsule, cylinder, cone, Viewer } = require("../3_summonscript");

const model = () => {
  const cap1 = capsule(10, 10).elongate([2, 0, 0]);
  const cone1 = cone.elongate(10, 10, 5, [2, 0, 0])
  const cyl1 = cylinder(10, 10);
  const cyl2 = cylinder(10, 5);

  return cone1
    .union(cap1.move([-30,0,0]))
    .union(cyl1.move([-15, 0, 0]))
    .union(cyl2.move([15, 0, 0]));
};

const region = [45+2,45+2,45+2];

Viewer.upload(model(), [region.mul(-1), region], 1, 4);
