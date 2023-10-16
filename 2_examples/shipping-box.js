// Parametric shipping box!

const { box, mm, cm, deg, Viewer } = require("../3_summonscript");

// Modify the parameters to get a box that fits your needs.
const dimensions = [5*cm, 5*cm, 5*cm];

const model = () => {
  const printer = { nozzleWidth: 0.6*mm, layerHeight: 0.4*mm, };

  const wallThickness = printer.nozzleWidth * 4;
  const floorThickness = printer.layerHeight * 3;

  // NOTE: This example was ported from an older version that rounded things.
  // For the sake of simplicity I've left out the rounding.
  // Not obvious what the ratio is here but 0.1 ~= 0.5*cm in this case.
  const rounding = 0.1;
  const offset = { rounding: 0.5*cm, };

  const base = box.roundedZ(dimensions, 4);

  const bottomCut = box.exact([dimensions[0], dimensions[1], offset.rounding]);

  const cutout = box.exact(
    [
      dimensions[0] - wallThickness * 2,
      dimensions[1] - wallThickness * 2,
      (dimensions[2] - floorThickness) - offset.rounding
    ]
  ).move([0, 0, floorThickness]);

  // There's lots of divide-by-2 because everything is centered by default.

  const topHeight = offset.rounding;
  const top = box.roundedZ([dimensions[0], dimensions[1], topHeight], 4)
    .move([0, 0, dimensions[2]/2 - topHeight/2]);

  const clip = {
    xAxis: [Math.sqrt(dimensions[0]), wallThickness*2, Math.sqrt(dimensions[2])],
    yAxis: [wallThickness*2, Math.sqrt(dimensions[1]), Math.sqrt(dimensions[2])],
  };

  const clipXAxis = box.exact(clip.xAxis)
    .move([
      dimensions[0]/2 - clip.xAxis[0]/2 - wallThickness/2,
      0,
      dimensions[2]/2 - topHeight - clip.xAxis[2]/2
    ]);

  const clipYAxis = clipXAxis.rotateZ(90*deg);

  const clipsXY = clipXAxis.union(clipYAxis);

  // As an exercise, try to make this parametric. The parameter is N clips.
  // You'll want to *distribute them* in some sort of fashion.
  const clips = clipsXY.union(clipsXY.rotateZ(180*deg));

  const shippingBoxTop =
    top.union(clips)

  const shippingBoxBottom = base
    .difference(cutout)
    .difference(shippingBoxTop);

  return shippingBoxBottom.union(shippingBoxTop.move([0, 0, topHeight+clip.xAxis[2]]));
};

const bb = [
  dimensions.div(-2).add(-1).add(-20),
  dimensions.div(2).add(1).add(20)
];

Viewer.upload(model(), bb, 0.1, 0.4);
