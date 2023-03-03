const koffi = require('koffi');

const {
  libfive_opcode_enum, libfive_opcode_tree, libfive_tree_eval_f, libfive_tree_print,
  libfive_tree_unary, libfive_tree_const, libfive_tree_binary, libfive_tree_remap,
  libfive_tree_x, libfive_tree_y, libfive_tree_z, libfive_tree_render_mesh,
  libfive_tree_render_mesh_coords, libfive_tree_save_mesh, libfive_tree_delete
} = require("./libfive.js");

const {
  union, box_exact, box_mitered, difference, rounded_box, intersection, symmetric_x,
  symmetric_y, symmetric_z, reflect_x, reflect_y, reflect_z, reflect_xy, reflect_yz,
  reflect_xz,
} = require("./libfive-stdlib.js");

// Our wrapper API
// Define unary and binary operations
const unary = (name) => (a) => libfiveVal(
  libfive_tree_unary(
    libfive_opcode_enum(name),
    typeof a !== "number" ? a.value : libfive_tree_const(a),
  )
);

const binary = (name) => (a) => (b) => libfiveVal(
  libfive_tree_binary(
    libfive_opcode_enum(name), 
    typeof a !== "number" ? a.value : libfive_tree_const(a),
    typeof b !== "number" ? b.value : libfive_tree_const(b),
  )
);

const add = binary("add");
const sub = binary("sub");
const mul = binary("mul");
const div = binary("div");

const square = unary("square");
const neg = unary("neg");
const abs = unary("abs");
const sqrt = unary("sqrt");

const min = binary("min");
const max = binary("max");

const move = ({ value }) => (x_, y_, z_) => {
  const v = TVec3(x_, y_, z_);
  const [x, y, z] = [X(), Y(), Z()];
  return libfiveVal(libfive_tree_remap(
    value,
    x.sub({ value: v.x }).value,
    y.sub({ value: v.y }).value,
    z.sub({ value: v.z }).value,
  ));
};

const free = ({ value }) => libfive_tree_delete(value);

const libfiveVal = (value) => ({
  value,
  add: add({ value }),
  sub: sub({ value }),
  mul: mul({ value }),
  div: div({ value }),
  square: () => square({ value }),
  union: ({ value: b }) => libfiveVal(union(value, b)),
  difference: ({ value: b }) => libfiveVal(difference(value, b)),
  intersection: ({ value: b }) => libfiveVal(intersection(value, b)),
  symmetric_x: () => libfiveVal(symmetric_x(value)),
  symmetric_y: () => libfiveVal(symmetric_y(value)),
  symmetric_z: () => libfiveVal(symmetric_z(value)),
  reflect_x: (offset) => libfiveVal(reflect_x(value, Value(offset).value)),
  reflect_y: (offset) => libfiveVal(reflect_y(value, Value(offset).value)),
  reflect_z: (offset) => libfiveVal(reflect_z(value, Value(offset).value)),
  reflect_xy: () => libfiveVal(reflect_xz(value)),
  reflect_yz: () => libfiveVal(reflect_yz(value)),
  reflect_xz: () => libfiveVal(reflect_xz(value)),
  move: move({ value }),
  toString: () => libfive_tree_print(value),
});

const X = () => libfiveVal(libfive_tree_x());
const Y = () => libfiveVal(libfive_tree_y());
const Z = () => libfiveVal(libfive_tree_z());
const Value = (value) => libfiveVal(libfive_tree_const(value));

const Region3 = (min, max) => ({
  X: { lower: min[0], upper: max[0] },
  Y: { lower: min[1], upper: max[1] },
  Z: { lower: min[2], upper: max[2] },
});

const alignToResolution = (x, resolution, isUpper) => (x - (x % (1/resolution))) + ((1/resolution)*(isUpper ? 1 : -1));

const toAlignedRegion3 = (region, resolution) => {
  const r_ = [
    region[0].map((p) => alignToResolution(p, resolution, false)),
    region[1].map((p) => alignToResolution(p, resolution, true)),
  ];
  return Region3(r_[0], r_[1]);
};

const toMesh = ({ value }, region, resolution) => {
  const r = toAlignedRegion3(region, resolution);
  const m = libfive_tree_render_mesh(value, r, resolution);
  return koffi.decode(m, "libfive_mesh");
};

const toMeshCoords = ({ value }, region, resolution) => {
  const r = toAlignedRegion3(region, resolution);
  const m = libfive_tree_render_mesh_coords(value, r, resolution);
  return koffi.decode(m, "libfive_mesh_coords");
};

const saveAsSTL = ({ value }, region, resolution, filepath) => {
  const r = toAlignedRegion3(region, resolution);
  return libfive_tree_save_mesh(value, r, resolution, filepath);
};

const Vec3 = (x, y, z) => ({ x, y, z });

const TVec2 = (x, y) => ({ x: Value(x).value, y: Value(y).value });
const TVec3 = (x, y, z) => ({ x: Value(x).value, y: Value(y).value, z: Value(z).value });

const nothing = () => Value(0);

const rectangle = ([ax, ay], [bx, by]) => {
  const a = TVec2(ax, ay);
  const b = TVec2(bx, by);

  const x = X();
  const y = Y();
  return max
    (max(a.x.sub(x))(x.sub(b.x)))
    (max(a.y.sub(y))(y.sub(b.y)));
};

const extrudeZ = (shape, zmin, zmax) => {
  const zminT = Value(zmin);
  const zmaxT = Value(zmax);
  const z = Z();
  return max(shape)(max(zminT.sub(z))(z.sub(zmaxT)));
};

const box = {
  mitered: (a_, b_, centered = false) => {
    const a = TVec3(...a_);
    const b = TVec3(...b_);
    return libfiveVal(box_mitered(a, b));
  },
  exact: (a_, b_, centered = false) => {
    const a = TVec3(...a_);
    const b = TVec3(...b_);
    return libfiveVal(box_exact(a, b));
  },
  rounded: (a_, b_, r) => {
    const a = TVec3(...a_);
    const b = TVec3(...b_);
    return libfiveVal(rounded_box(a, b, Value(r).value));
  },
};

const mm = 1;
const cm = 10;

module.exports = {
  mm,
  cm,
  unary,
  binary,
  add,
  sub,
  mul,
  div,
  square,
  neg,
  abs,
  sqrt,
  min,
  max,
  union,
  intersection,
  difference,
  symmetric_x,
  symmetric_y,
  symmetric_z,
  free,
  X,
  Y,
  Z,
  Value,
  nothing,
  box,
  extrudeZ,
  rectangle,
  TVec2,
  TVec3,
  Vec3,
  Region3,
  saveAsSTL,
  toMesh,
  toMeshCoords,
  libfiveVal,
};
