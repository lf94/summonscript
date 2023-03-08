// Parametric shipping box!

const { box, saveAsSTL,toMesh,  mm, cm } = require("../index.js");

// Modify the parameters to get a box that fits your needs.
const dimensions = [5*cm, 5*cm, 5*cm];

const printer = { nozzleWidth: 0.6*mm, layerHeight: 0.4*mm, };

const wallThickness = printer.nozzleWidth * 4;
const floorThickness = printer.layerHeight * 3;

// Not obvious what the ratio is here but 0.1 ~= 0.5*cm in this case.
const rounding = 0.1;
const offset = { rounding: 0.5*cm, };

const base = box.smooth([0,0,0], dimensions, rounding);

const bottomCut = box.exact([0,0,0], [dimensions[0], dimensions[1], offset.rounding], false);

const cutout = box.smooth(
  [wallThickness, wallThickness, floorThickness],
  [
    dimensions[0] - wallThickness,
    dimensions[1] - wallThickness,
    (dimensions[2] - floorThickness) - offset.rounding
  ],
  rounding
);

const clip = {
  xAxis: [Math.sqrt(dimensions[0]), wallThickness*2, Math.sqrt(dimensions[2])],
  yAxis: [wallThickness*2, Math.sqrt(dimensions[1]), Math.sqrt(dimensions[2])],
};

const clipXAxisNear = box.exact([0,0,0], clip.xAxis, false)
  .move([(dimensions[0] - clip.xAxis[0]) / 2, wallThickness/2, (dimensions[2] - offset.rounding) - clip.xAxis[2]])
const clipXAxisFar = box.exact([0,0,0], clip.xAxis, false)
  .move([(dimensions[0] - clip.xAxis[0]) / 2, dimensions[1] - wallThickness - clip.xAxis[1]/2, (dimensions[2] - offset.rounding) - clip.xAxis[2]])
const clipYAxisNear = box.exact([0,0,0], clip.yAxis, false)
  .move([wallThickness/2, (dimensions[1] - clip.yAxis[1]) / 2, (dimensions[2] - offset.rounding) - clip.yAxis[2]])
const clipYAxisFar = box.exact([0,0,0], clip.yAxis, false)
  .move([dimensions[0] - wallThickness - clip.yAxis[0]/2, (dimensions[1] - clip.yAxis[1]) / 2, (dimensions[2] - offset.rounding) - clip.yAxis[2]])

const clips = clipXAxisFar.union(clipXAxisNear).union(clipYAxisFar).union(clipYAxisNear);

const wallIntersectionsX = box
  .exact([clip.xAxis[0], dimensions[1] - wallThickness, clip.xAxis[2]])
  .move([dimensions[0]/2, dimensions[1]/2, (dimensions[2] - offset.rounding/2) - clip.yAxis[2]/2]);

const wallIntersectionsY = box
  .exact([dimensions[0] - wallThickness, clip.yAxis[1], clip.yAxis[2]])
  .move([dimensions[0]/2, dimensions[1]/2, (dimensions[2] - offset.rounding/2) - clip.yAxis[2]/2]);

const top = box.exact([0,0,0], [dimensions[0], dimensions[1], offset.rounding/2], false)
  .move([0, 0, dimensions[2] - offset.rounding/2]);

const shippingBoxTop = base.intersection(
  top
  .blend(clips, 8.0)
  .intersection(
    top.union(wallIntersectionsX.union(wallIntersectionsY))
  )
);

const shippingBoxBottom = base
  .difference(bottomCut)
  .difference(cutout.move([0, 0, offset.rounding]))
  .difference(shippingBoxTop);


saveAsSTL(shippingBoxBottom, [[0,0,0], dimensions], 1, "shipping-box-bottom.stl");
saveAsSTL(shippingBoxTop, [[0,0,0], dimensions], 1, "shipping-box-top.stl");
