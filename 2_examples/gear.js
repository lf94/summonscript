const {
  deg, intersectionLineCircle, threePointArc, circle, Viewer, repeatRadial,
  distributeRadial
} = require("../3_summonscript");

// This was pain.
// The person in the video did not make it clear that these were a mix of
// radius and diameters.
// Additionally they did them in the weirdest of orders.

// The guide circles for the 3-point arc
// I've normalized the radiuses and orders for my sanity.
const d1 = 2.571;
const d2 = 3.0;
const d3 = 3.333;

// The guide lines for the 3-point arc
const l1 = [0, 0.047];
const l2 = [0, 0.130];

// The angle line
const l3 = [0, 0.107];

// Start finding intersections to calculate the spacing angle.
const i1 = intersectionLineCircle(0*deg, l3, d1/2)[0];
const a1 = Math.atan2(i1[1], i1[0]) * 2;

const cells = 18;
const spacing = distributeRadial(a1, cells);
const q1Cells = cells / 4;
const a1s = q1Cells*a1;
const spacings = Math.floor(q1Cells)*spacing;
const start = 90*deg;

const p1 = [
  Math.cos(start-(spacings+a1s))*(d1/2),
  Math.sin(start-(spacings+a1s))*(d1/2),
];

const p2 = intersectionLineCircle(0*deg, l2, d2/2)[0];
const p3 = intersectionLineCircle(0*deg, l1, d3/2)[0];

const [xy, r] = threePointArc(p1, p2, p3);

const tooth = circle(r*2).move([xy[0],  xy[1], 0])
  .intersection(circle(r*2).move([xy[0], -xy[1], 0]))
  .difference(circle(d1))
  .intersection(circle(d3));

const teeth = repeatRadial(tooth, cells);

const gear = teeth.unionSmooth(circle(d1), 0.05);

const spur = gear.extrudeZ(0, 0.5);
const bevel = gear.extrudeZ(0, 0.5).taperXYAlongZ([0, 0, 0], 1.0, 0.5, 1);
const helical = gear.extrudeZ(0, 0.5).twist(1);
const miter = bevel.twist(1);

const bb = [20, 20, 20];
Viewer.upload(miter, [bb.mul(-1), bb], 10, 30);
