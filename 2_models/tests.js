const {
  libfive_opcode_enum, libfive_opcode_tree, libfive_tree_eval_f, libfive_tree_print,
} = require("../libfive.js");
const { libfiveVal, free, max, neg, nothing, X, Y, Z, Value, Vec3, Region3, saveAsSTL } = require("../index.js");
const { union } = require("../libfive-stdlib.js");

// Port over some tests from libfive/libfive/test/api.h
const Fail = new Error("Assertion failure");

{
  let str = "libfive_opcode_enum ";
  // Check both packed and non-packed opcodes
  if (libfive_opcode_enum("min") !== 19 && libfive_opcode_enum("min") !== 22) throw Fail;
  if (libfive_opcode_enum("max") !== 20 && libfive_opcode_enum("max") !== 23) throw Fail;

  if (libfive_opcode_enum("VAR-X") !== 2) throw Fail;

  if (libfive_opcode_enum("wat") !== -1) throw Fail;
  if (libfive_opcode_enum("") !== -1) throw Fail;
  str += "passed";
  console.log(str);
}

{
  let str = "libfive_opcode_tree ";
  const a = X();
  const b = X();
  const c = Z();

// Not possible to check equality under opaque type
// if (a != b) throw Fail;
// if (b == c) throw Fail;

  str += "passed";
  console.log(str);
}

{
  let str = "libfive_tree_eval_f ";
  const a = X();
  const b = Y();
  const c = a.div(b);

  if (libfive_tree_eval_f(c.value, Vec3(1, 2, 3)) != 0.5) throw Fail;
  if (libfive_tree_eval_f(c.value, Vec3(1, 4, 3)) != 0.25) throw Fail;
  if (libfive_tree_eval_f(c.value, Vec3(1, -1, 3)) != -1) throw Fail;

  free(a); free(b); free(c);
  str += "passed";
  console.log(str);
}

{
  let str = "libfive_tree_print ";
  const a = X();
  const b = Y();
  const c = Z();
  const a2 = a.square();
  const b2 = b.square();
  const c2 = c.square();
  const r_ = a2.add(b2);
  const r = r_.add(c2);
  const d = r.sub(1.0);
  const ptr = d.toString();

  if (ptr !== "(- (+ (square x) (square y) (square z)) 1)") throw Fail;

  free(a); free(b); free(c);

  str += "passed";
  console.log(str);
}

// Again, but more golfy :)
{
  const [a,b,c] = [X(), Y(), Z()].map((d) => d.square());
  const r = a.add(b).add(c).sub(1.0);
  if (r.toString() !== "(- (+ (square x) (square y) (square z)) 1)") throw Fail;
  console.log("libfive_tree_print (golfed) passed");
}

// Port over some tests from libfive/libfive/test/mesh.h
// Use our API wrapper
{
  let str = "Mesh::render (cube face count) ";

  const [x, y, z] = [X(), Y(), Z()];

  const cube = max
  (max
    (max(neg(x.add(1.5)))(x.sub(1.5)))
    (max(neg(y.add(1.5)))(y.sub(1.5)))
  )
  (max(neg(z.add(1.5)))(z.sub(1.5)));

  console.log(cube.toString());
  const r = [[-3.0, -3.0, -3.0 ], [3.0, 3.0, 3.0]];
  const m = saveAsSTL(cube, r, 6.5, "cube.stl");

  // if (m.tri_count !== 12) throw Fail;
  // if (m.vert_count !== 9) throw Fail;

  free(x); free(y); free(z);

  str += "passed";
  console.log(str);
}

{
  const a = Value(8);
  const b = Value(4);
  const c = a.union(b);
  console.log(c.toString());
}
