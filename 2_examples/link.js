const { XYZ, abs, max, length } = require("../3_summonscript/lib/math");

const link = (le, r1, r2) => {
  const [x,y,z] = XYZ();
  const q = [x, max(abs(y).sub(le), 0.0), z];
  return length([length([q[0], q[1]]).sub(r1), z])
    .sub(r2)
    .move([r1, 0, 0]);
};
module.exports.link = link;
