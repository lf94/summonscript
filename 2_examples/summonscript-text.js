const { print2d, sphere, box, Viewer } = require("../3_summonscript");

// Due to multithreading of libfive, we must do things like this.
const model = (t) => {
  const wave = Math.sin(t/360 * 2*Math.PI);

  const text = print2d("Summon\nScript")
  .extrudeZ(0, 0.5)
  .move([-1.8, 0, 0.1]);

  const ballPosition = [-1*wave, 1, 1];
  const ball = sphere(0.5).move(ballPosition);
  const cube = box.exact([0.5, 0.5, 0.5])
    .move(ballPosition.add([0.5, 0, 1*wave]));

  return text.union(ball).unionBlend(cube, 0.5)
};

const res = 5;
const bb = [res, res, res];
const boundingBox = [bb.div(-2), bb.div(2)];

//preview(model(60), boundingBox, res, res*2.6);

// Let's do a little animation
const fn = (t) => {
  return Viewer.upload(model(t), boundingBox, res, res)
  .then(() => {
    if (t >= 360) return;
    return fn(t+2);
  });
};

fn(0);
