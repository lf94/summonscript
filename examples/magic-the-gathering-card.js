// A playing card, with the dimensions of Magic the Gathering cards.
// Print with a 0.1mm height!

const { X,Y,Z,box,mm,saveAsSTL } = require("../index");

const [$X,$Y,$Z] = [X(),Y(),Z()];
const xyz = [$X,$Y,$Z];
const xy = [$X,$Y];

const sketch = box.rounded([63.5*mm, 88.9*mm], 3.0*mm);
const result = sketch.extrudeZ(0, 0.3);

const region = [100,100,100];
saveAsSTL(result, [region.mul(-1), region], 10.0, "magic-the-gathering-card.stl");
