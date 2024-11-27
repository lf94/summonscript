const { saveAs, Viewer, deg, mm, box, sphere, cylinder, halfSpace } = require("../3_summonscript");

const nozzleDiameter = 2*mm;

const d = {
  face: {
    width: 37.9*mm + 2*mm + nozzleDiameter*2, // tolerance
    height: 12.0*mm + 4*mm /* nub for suction cup */ + 2*mm + nozzleDiameter*2, // tolerance
    length: 38.2*mm,
  },
  band: {
    width: 24.3*mm,
    height: 6.0*mm,
  },
  frame: 8*mm,
  thickness: nozzleDiameter,
  rounded: 10*mm,
};


const face = [d.face.width, d.face.length, d.face.height];

const boxRZ = (wlh, r) => {
  return cylinder(wlh[2], r).elongate([wlh[0] - r, wlh[1] - r, 0]);
};

const container = boxRZ(face, d.rounded);
const plane = boxRZ([d.face.width, d.face.length, d.thickness], d.rounded);
const inner = box(face.sub(d.thickness*2+4*2)).sub(4);

const faceHole = boxRZ(face.sub([d.frame*2, d.frame*2, d.face.height]).add([0, 0, d.thickness+1*mm]), 6);

const result = container
  .difference(inner)
  .difference(faceHole.move([0, 0, d.face.height/2 - d.thickness/2]))
  .difference(halfSpace([0, -1, 0]).move([0, 10*mm/2 + d.thickness, 0]))
  .intersection(boxRZ([d.face.width, d.face.length/2 + 10*mm/2 + d.thickness, d.face.height], d.rounded)
                .move([0, 10*mm/-2 - d.thickness*1.5, 0]))
  .difference(cylinder(d.thickness*2 + 1*mm, 10*mm).move([0, 0, d.face.height/-2 + d.thickness]))
  .difference(
    boxRZ([d.band.width, d.band.height, d.thickness+d.rounded], 2).rotateX(90*deg)
    .move([0,d.face.length/-2 + d.thickness/2,0])
  )

const bb = face.add(20);

Viewer.upload(result, [bb.mul(-1), bb], 1, 2);
//saveAs.stl(result, [bb.mul(-1), bb], 3, "casio-a168-holder.stl");
