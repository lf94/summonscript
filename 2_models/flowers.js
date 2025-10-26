const { sphere, Viewer, repeatRadial } = require("../3_summonscript");

let d = 1;
let h = 1;
let result = repeatRadial(sphere(d).move([d/2, 0, 0]), 3);

for (let i = 2; i < 10; i++) {
  let d_ = d*(i*0.2);
  let h_ = h;
  result = result.unionSmooth(repeatRadial(sphere(d_).move([d_, 0, 0.1*-i]), i*2), 0.5);
}


const bb = [20, 20, 20];
Viewer.upload(result, [bb.mul(-1), bb], 1, 1);
