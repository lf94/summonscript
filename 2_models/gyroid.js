const { Viewer, gyroid, sphere } = require("../3_summonscript");

const lattice = gyroid()
.offset(1.0)

const ball = lattice.intersection(sphere(5));
const ball2 = ball.difference(sphere(4.5)).intersection(lattice.scaleXYZ([0.25, 0.25, 0.25]));

Viewer.upload(ball2, [[-3, -3, -3],[3, 3, 3]], 1, 10);
