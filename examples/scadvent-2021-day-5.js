const { preview } = require("../utils/preview");
const { box, sphere, nothing } = require("../index.js");

// Recreate Day 5 of Scadvent 2021
const tetrominos = [
 [[1,1,1,1],
  [0,0,0,0]],
 [[0,0,0,2],
  [0,0,1,1]],
 [[0,1,1,0],
  [1,1,0,0]],
 [[1,1,0,0],
  [1,1,0,0]],
 [[0,0,2,0],
  [0,0,1,1]],
 [[0,1,1,1],
  [0,0,0,1]],
 [[0,0,1,2],
  [0,0,0,1]],
 [[0,0,1,0],
  [0,1,1,1]],
];

const ts = tetrominos.map((t) => {
  let result = nothing();
  for (let y = 0; y < t.length; y += 1) {
    for (let x = 0; x < t[y].length; x += 1) {
      const h = t[y][x];
      if (h !== 0)  {
        for (let z = 0; z < h; z += 1) {
          result = result.union(box.exact([1, 1, 1]).move([x,y,z]));
        }
      }
    }
  }
  return result;
});

const result = ts.reduce(
  (result, cur, index) => {
    console.log(result, cur);
    return result.union(cur.move([index * 5, 0, 0]));
  }, nothing()
);

const r = [[ts.length * -5, -10, -10], [ts.length * 5, 10.0, 10.0]];
preview(result.move([ts.length * -2.5, 0, 0]), r, 1, 4);
