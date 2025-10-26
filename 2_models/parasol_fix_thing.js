const { cylinder, polar, Viewer, saveAs } = require("../3_summonscript");

const model = () => {
  const angle = Math.PI*2 / 3;
  return cylinder(10, 39.45*2)
  .difference(cylinder(10, 11))
  .difference(cylinder(10, 40).move([...polar(39.45, angle*1), 0]))
  .difference(cylinder(10, 40).move([...polar(39.45, angle*2), 0]))
  .difference(cylinder(10, 40).move([...polar(39.45, angle*3), 0]))
};

const r = [[-100, -100, -100], [100, 100, 100]];

Viewer.upload(model(), r, 1, 2**2);
saveAs.stl(model(), r, 4, "out.stl");
