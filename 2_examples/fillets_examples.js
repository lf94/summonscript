const { Viewer, box, halfSpace, deg } = require("../3_summonscript");

const walls = box([1, 1, 1]).sub(0.1)
  //.differenceRound(box([1, 1, 1]).rotateY(45*deg).move([1 - 0.25, 0, 1 - 0.25]), 0.1)
  //.union(box([1, 1, 1]).rotateY(45*deg).move([1 - 0.25, 0, 1 - 0.25]), 0.1);

const result = walls
// middle cut
.difference(
  // and so is this. So why is there material below?
  // Because of the union round. But why does it cause this?
  box([1 - ((1-0.75)) - 0.1*2, 1, 0.25])
  .move([0, 0, 1/-2 + 0.25/2])
)

const bb = [[-10, -10, -10], [10, 10, 10]];
Viewer.upload(result, bb, 20, 30);
