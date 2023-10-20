const { cm, box, deg, sphere, Viewer, saveAs } = require("../3_summonscript");

const d = {
  h: 10*cm,
  glass: {
    w: 13.5*cm,
  },
  cubeHole: 0.5*cm,
  cubeSpacing: 0.3*cm,
  lipThickness: 0.3*cm,
};

const base = box.roundedZ([6.4*cm, 12.75*cm, d.h + 0.4*cm], 1*cm);
const baseCutTop = base.difference(
  box.exact([13.5*cm, 20*cm, 0.4*cm])
    .move([-((13.5*cm+6.4*cm)/2)+6.4*cm-d.lipThickness, 0, d.h/2 + 0.4*cm/2])
);

const baseCut = baseCutTop.difference(
  box.roundedZ([6.4*cm, 12.75*cm - d.lipThickness*2, d.h + 0.4*cm], 1*cm)
  .move([-d.lipThickness, 0, 0])
);

const cube = box.roundedZ([d.cubeHole, d.cubeHole, d.cubeHole], 0.2*cm).rotateZ(45*deg);
const cubeL = Math.sqrt(d.cubeHole**2 + d.cubeHole**2);

const baseWithCubes = baseCut
.union(cube.move([6.4*cm/2-d.lipThickness/2, 0, (d.h+0.4*cm)/-2 - d.cubeHole/2]))
.union(cube.move([6.4*cm/2-d.lipThickness/2, (cubeL+d.cubeSpacing)*4, (d.h+0.4*cm)/-2 - d.cubeHole/2]))
.union(cube.move([6.4*cm/2-d.lipThickness/2, (cubeL+d.cubeSpacing)*-4, (d.h+0.4*cm)/-2 - d.cubeHole/2]))
.union(cube.move([6.4*cm/2-d.lipThickness/2 - (cubeL+d.cubeSpacing)*3, (cubeL+d.cubeSpacing)*6, (d.h+0.4*cm)/-2 - d.cubeHole/2]))
.union(cube.move([6.4*cm/2-d.lipThickness/2 - (cubeL+d.cubeSpacing)*3, (cubeL+d.cubeSpacing)*-6, (d.h+0.4*cm)/-2 - d.cubeHole/2]))

const bb = [20*cm, 20*cm, 20*cm];
saveAs.stl(baseWithCubes, [bb.mul(-1), bb], 0.4, "out.stl");
// Viewer.upload(baseWithCubes, [bb.mul(-1), bb], 0.4, 0.8);
