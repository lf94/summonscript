cosnt { annotate } = require("../utils/annotate");
const { print2d, sphere, box, preview } = require("../index");

const model = (t) => () => {
  const wave = Math.sin(t/360 * 2*Math.PI);

  annotate(1, [[0,0,0],[1,2,6]], "10cm");
  annotate(2, [[0,0,0],[1,2,6]], "2cm");

  const text = print2d("Summon\nScript")
  .extrudeZ(0, 0.5 * wave)
  .move([-1.8, 0, 0.1]);

  const ballPosition = [-1*wave, 1, 1];
  const ball = sphere(0.5).move(ballPosition);
  const cube = box.exact([0.5, 0.5, 0.5])
    .move(ballPosition.add([0.5, 0, 1*wave]));

  return text.union(ball).blend(cube, 0.5)
};

const res = 5;
const bb = [res, res, res];
const boundingBox = [bb.div(-2), bb.div(2)];

// Let's do a little animation
const fn = (t) => {
  return preview(model(t), boundingBox, res*2, res*2)
  .then(() => {
    if (t >= 360) return;
    return fn(t+2);
  });
};

fn(0);
