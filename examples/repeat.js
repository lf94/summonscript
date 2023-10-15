const { box, sphere, preview } = require("../index");

const model = () => {
  return sphere(1).move([0, 0, 5]);
};

const bb = [[-10, -10, -10],[10,10,10]];
preview(model, bb, 5, 10);
