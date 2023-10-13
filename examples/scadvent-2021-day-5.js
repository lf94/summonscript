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

const model = (defs) => () => {
  const ts = defs.map((t) => {
    let result = undefined;
    for (let y = 0; y < t.length; y += 1) {
      for (let x = 0; x < t[y].length; x += 1) {
        const h = t[y][x];
        if (h !== 0)  {
          for (let z = 0; z < h; z += 1) {
            if (result == undefined) {
              result = box.exact([1, 1, 1]).move([x,y,z]);
            } else {
              result = result.union(box.exact([1, 1, 1]).move([x,y,z]));
            }
          }
        }
      }
    }
    return result;
  });

  return ts.reduce(
    (last, cur, index) => {
      if (last === undefined) {
        return cur.move([index * 5, 0, 0]);
      }
      return last.union(cur.move([index * -5, 0, 0]));
    }
  ).move([ts.length * -2.5, 0, 0]);
};

const r = [
  [tetrominos.length * -5, -10, -10],
  [tetrominos.length * 5, 10.0, 10.0]
];

preview(model(tetrominos), r, 1, 4);
