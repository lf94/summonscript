const { cube, nothing, saveAsSTL } = require("../index.js");

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
          result = result.union(cube.exact(1, [x, y, z]));
        }
      }
    }
  }
  return result;
});

const result = ts.reduce((result, cur, index) => result.union(cur.move(index * 5, 0, 0)), nothing()); 
const r = [[0, -10, -10], [ts.length * 5, 10.0, 10.0]];
saveAsSTL(result, r, 10, "out.stl");
