const { sin, cos, cappedTorus, box, cheapBend, repeatRadial, XYZ, abs, cylinder, deg, Viewer, halfSpace } = require("../3_summonscript");
const { link } = require("./link");

const internalSpring = (n, le, r1, r2) => {
  const ang = 220*deg;

  const ri = r1 / 2;
  const ls = le-ri;

  const pen = { x: 0, y: 0 };

  const b = cylinder(ls, r2*2).rotateX(90*deg).move([0, ls/2, 0]);

  pen.y += ls;

  const r = (180*deg - ang)/2;

  pen.x += r1;

  const t = cappedTorus(ang, r1, r2)
    .rotateZ(r)
    .move([pen.x, pen.y, 0]);

  pen.x += Math.cos(r*2)*r1;
  pen.y += Math.sin(r*2)*r1;

  const i = cylinder(le-ri-r2*2, r2*2)
    .rotateX(90*deg)
    .move([0, (le-ri-r2*2)/-2, 0])
    .rotateZ(r*2)
    .move([pen.x, pen.y, 0])

  pen.x += Math.cos((90*deg)-r*2)*(le-ri-r2*2);
  pen.y += Math.sin((90*deg)-r*2)*(le-ri-r2*2)*-1;

  const ang2 = 50*deg;

  let c = {
    x: Math.cos((180*deg - ang2)/2) * ri * -1,
    y: Math.sin((180*deg - ang2)/2) * ri * -1,
  }

  const t2 = cappedTorus(ang2, ri, r2)
    .move([c.x, c.y, 0])
    .rotateZ((ang - (ang2/2))/2)
    .move([pen.x, pen.y, 0])

  let c2 = {
    x: Math.cos(ang2 + (360*deg - ang)) * ri*2,
    y: Math.sin(ang2 + (360*deg - ang)) * ri*2,
  }

  pen.x += c2.x;
  pen.y += c2.y;

  const one = t.union(b).union(i).union(t2);

  let model = one; //.union(one.rotateZ(180*deg - ang).move([pen.x, pen.y, 0]));
  return model;
};

const d = {
  thickness: 0.2,
  reps: 1,
  pitch: 0.4,
  innerDiameter: 2.5,
}

const springLength = ((((d.pitch + d.thickness * 2) * 2)) * (d.reps + 1));

// let model = repeatRadial(
//     cheapBend(
//         internalSpring(d.reps, 0.40, d.pitch, d.thickness)
//         .move([-(springLength/2), 0, 0])
//       , 0.3)
//       .rotateZ(-80*deg)
//     .move([2.5, 0, 0]),
//     3
// );

let model = internalSpring(d.reps, 4, 1.8, 0.25);

// const middlePost = cylinder(d.thickness * 2, d.innerDiameter)
//   .difference(cylinder(d.thickness * 2, d.innerDiameter - 1));

// const outside = cylinder(d.thickness * 2, 8)
//   .difference(cylinder(d.thickness * 2, 8 - 1))

// model = model.union(middlePost).union(outside);

const bb = [[-10,-10,-10],[10,10,10]];
Viewer.upload(model, bb, 1, 5);
