// This whole thing would be even better if bounding box tracking was implemented.
// And if stream-mesh-to-file was done.
// Then tiny details could be meshed.
const {
  box, cone, cylinder, ellipsoid, sphere, triangle, saveAs, mm, cm, deg, Value,
  X,Y,Z,sqrt,abs,atan2, halfSpace, cos, sin
} = require("../3_summonscript");

const { egg } = require("../3_summonscript/lib/egg");

const printer = {
  layerHeight: 0.2*mm,
  nozzleDiameter: 0.4*mm,
};

const holdAngle = 7*deg;

const centerOffset = (a, b) => Math.abs(a - b) / 2;

// const dHost = [152.6, 73.6, 10.0]; // moto g8 play
// const dHost = [166.9, 76.0, 8.8]; // s20 ultra
// const dHost = [149.9, 70.4, 7.8]; // s10
const dHost = [149.9 /* not measured */, 78.0, 13.0]; // moto 
const rHost = 1;
const dEdge = dHost.sub([7.0 * 2.0, 0, -2]);

const dBase = [36.0, 90.0, 32.0];
const pBase = [
  dHost[0] / 2,
  centerOffset(dHost[1], dBase[1]) * -3,
  dHost[2] / -2,
];
const unitsFromHostMiddle = -25.0*mm;

const pPhoneRest = dHost;

const dIndexRest = 17.0;
const pIndexRest = [
  pBase[0],
  pBase[1] + (dBase[1] / 2) - dIndexRest,
  pBase[2]-dIndexRest
];

const dPalmRest = [15.0, 0, 0];
const pPalmRest = [
  pBase[0] + (dBase[0] / 2),
  pBase[1],
  dHost[2] / -2,
];

const hTopCut = 2.0*mm;
const dTopCut = [dBase[0]*2, dBase[1]*2, hTopCut];
const pTopCut = [pBase[0], pBase[1], pBase[2] + dBase[2] / 2 - hTopCut];
const pSideCut = [pBase[0] - dBase[0]/2 + 5*mm, pBase[1], pBase[2]];
const pSideCut2 = [pBase[0] + dBase[0]/2 + 5*mm, pBase[1], pBase[2]];

const dChargerHole = [100, 25, dHost[2]];
const pChargerHole = [
  dHost[0] / 2,
  pBase[1] + (dBase[1] / 2) - dChargerHole[1],
  0,
];

const mag = (x, y) => sqrt(x.square().add(y.square()));
const thread = (radius_, screw_) => {
  const [x,y,z] = [X(), Y(), Z()];
  const radius = new Value(radius_);
  const screw = new Value(screw_);
  const rad = mag(x,y).sub(radius);
  const th = (
    rad.sub(
      abs(
       z.mul(screw).sub(atan2(y, x)).div(Math.PI / 2)
         .mod(1)
         .sub(0.5)
      ).div(screw)
    )
  );
  return th;
};

const bolt = (diameter, height, pitch) =>
  thread(diameter / 2, pitch)
  .intersection(
    cylinder(
      height,
      // Must consider nozzle diameter when printing otherwise certain features
      // won't print properly. For higher precision manufacturing, it can be
      // removed.
      diameter + (1/pitch) - (printer.nozzleDiameter * 2),
     ).move([0,0,height/2])
  );

const waveyYZ = (shape, frequency, amplitude) => {
  const [x,y,z] = [X(), Y(), Z()];
  const wiggle = y.add(cos(z.mul(frequency)).mul(amplitude))
  return shape.remap([x, wiggle, z]);
};
const waveyXY = (shape, frequency, amplitude) => {
  const [x,y,z] = [X(), Y(), Z()];
  const wiggle = x.add(cos(y.mul(frequency)).mul(amplitude))
  return shape.remap([wiggle, y, z]);
};
const waveyXZ = (shape, frequency, amplitude) => {
  const [x,y,z] = [X(), Y(), Z()];
  const wiggle = z.add(cos(y.mul(frequency)).mul(amplitude))
  return shape.remap([x, y, wiggle]);
};

const cutFromTangentOf = (angle, d, axis) =>
({
  "x": Math.cos(angle),
  "y": Math.sin(angle),
}[axis]) * (d / 2) + (d / 2);

const dBarHole = 10*mm;
const pBarHole = pBase.add([0, 10, -10]);

const dBar = { d: dBarHole * (1-0.13), h: dHost[0] + dBase[0], p: 0.5 };
const pBar = [0,0,0];

const dHandle = dBase.add(dPalmRest);

const wavey = ($shape) => {
  return waveyYZ($shape, 6.0, 0.25)
};

const handleBase = 
   waveyXZ(egg(dHandle[0]).move([0, dHandle[0]/-5, 0]).scaleY(1.75), 0.125, -4.0)
   .move(pBase)
   .unionSmooth(sphere(dIndexRest).move(pIndexRest), 10)
   .rotateZ(holdAngle)

const handle = handleBase
  .move([0, -25, 0])
  // .difference(box(dChargerHole).move(pChargerHole))
  .difference(halfSpace([1,0,0]).rotateZ(holdAngle).rotateY(-10*deg).move(pSideCut), 5)
  .unionSmooth(box(dHost.div([1.75, 2, 1]).add([0,0,15]), 5).move(pBase.sub(dHost.mul([0.33, 0, 0])).add([0,-10*mm,dHost[2]/2])), 10)
  .difference(halfSpace([0,0,-1]).move(pTopCut))
  .difference(box(dHost, rHost).move([0,-10, -5]), 4)
  .difference(box(dEdge, rHost).move([0,-5, dHost[2] - 5]))

const bar = ({ d, h, p }) => {
  const barOffset = cutFromTangentOf(45*deg, d/2, "y");

  return bolt(d, h, p).move([0,0,h/-2])
    .union(sphere(d).move([0,0,h/2]))
    .union(sphere(d).move([0,0,h/-2]))
    .rotateY(90*deg)
    .difference(halfSpace([0, 0, -1]).move([0,0,barOffset]))
    .difference(halfSpace([0, 0, 1]).move([0,0,-barOffset]))
};

const screwBar = bar(dBar);
const screwBarHole = bolt(dBarHole, 1000, dBar.p).rotateY(90*deg).move([40, -20, 2]);

const farthest = dHost.add(dBase).add(dPalmRest);

const ergoRight = wavey(handle)
  // .difference(screwBarHole.move(pBarHole))
  .move([-100, 25, 0]);
const ergoLeft = ergoRight.reflectY(10)
  // .difference(screwBarHole.move(pBarHole));
const ergoBar = screwBar;

const r_1 = [400,400,400];//dBase.add(dPalmRest);
const region = [r_1.mul(-1), r_1];

const region2 = () => {
  const b = [dBar.h + dBar.d, dBar.d +dBar.h , dBar.d + dBar.h ];
  return [b.div(-2), b.div(2)];
};

//console.log("saving ergo-right");
//saveAs.stl(ergoRight, region, 2.0, "ergo-right.stl");
// console.log("saving ergo-left");
// saveAs.stl(ergoLeft, region, 2.0, "ergo-left.stl");
//console.log("saving ergo-bar");
//saveAs.stl(ergoBar, region2(), 2.0, "ergo-bar.stl");
Viewer.upload(ergoLeft, region, 1, 20);
