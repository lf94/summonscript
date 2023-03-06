const koffi = require('koffi');

const {
  libfive_opcode_enum, libfive_opcode_tree, libfive_tree_eval_f, libfive_tree_print,
  libfive_tree_unary, libfive_tree_const, libfive_tree_binary, libfive_tree_remap,
  libfive_tree_x, libfive_tree_y, libfive_tree_z, libfive_tree_render_mesh,
  libfive_tree_render_mesh_coords, libfive_tree_save_mesh, libfive_tree_delete,
} = require("./libfive.js");

const {
  union, box_exact, box_mitered, difference, rounded_box, intersection, symmetric_x,
  symmetric_y, symmetric_z, reflect_x, reflect_y, reflect_z, reflect_xy, reflect_yz,
  reflect_xz, emptiness, scale_x, scale_y, scale_z, sphere, 
  scale_xyz, move, box_exact_centered, box_mitered_centered, rotate_z,   twirl_x, twirl_y, twirl_z, array_x, triangle, extrude_z, offset, cylinder_z,
  rotate_y, rotate_x, rounded_rectangle
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
const mod = binary("mod");

const square = unary("square");
const neg = unary("neg");
const abs = unary("abs");
const sqrt = unary("sqrt");

const min = binary("min");
const max = binary("max");

const atan2 = binary("atan2");

const free = ({ value }) => libfive_tree_delete(value);

const libfiveVal = (value) => ({
  value,
  add: add({ value }),
  sub: sub({ value }),
  mul: mul({ value }),
  div: div({ value }),
  mod: mod({ value }),
  square: () => square({ value }),
  union: ({ value: b }) => libfiveVal(union(value, b)),
  difference: ({ value: b }) => libfiveVal(difference(value, b)),
  intersection: ({ value: b }) => libfiveVal(intersection(value, b)),
  offset: (o) => libfiveVal(offset(value, Value(o).value)),
  blend: (b, m) => blend.smooth2(libfiveVal(value), b, Value(m)),
  blendDifference: (b, m) => blend.difference2(b, libfiveVal(value), Value(m)),
  rotateX: (radians) => libfiveVal(rotate_x(value, Value(radians).value, TVec3(0,0,0))),
  rotateY: (radians) => libfiveVal(rotate_y(value, Value(radians).value, TVec3(0,0,0))),
  rotateZ: (radians) => libfiveVal(rotate_z(value, Value(radians).value, TVec3(0,0,0))),
  symmetricX: () => libfiveVal(symmetric_x(value)),
  symmetricY: () => libfiveVal(symmetric_y(value)),
  symmetricZ: () => libfiveVal(symmetric_z(value)),
  reflectX: (offset) => libfiveVal(reflect_x(value, Value(offset).value)),
  reflectY: (offset) => libfiveVal(reflect_y(value, Value(offset).value)),
  reflectZ: (offset) => libfiveVal(reflect_z(value, Value(offset).value)),
  reflectXY: () => libfiveVal(reflect_xz(value)),
  reflectYZ: () => libfiveVal(reflect_yz(value)),
  reflectXZ: () => libfiveVal(reflect_xz(value)),
  twirlX: (amount, radius, offset) => libfiveVal(twirl_x(value, Value(amount).value, Value(radius).value, TVec3(...offset))),
  twirlY: (amount, radius, offset) => libfiveVal(twirl_y(value, Value(amount).value, Value(radius).value, TVec3(...offset))),
  twirlZ: (amount, radius, offset) => libfiveVal(twirl_z(value, Value(amount).value, Value(radius).value, TVec3(...offset))),
  arrayX: (amount, distanceBetween) => libfiveVal(array_x(value, amount, Value(distanceBetween).value)),
  extrudeZ: (zmin, zmax) => libfiveVal(extrude_z(value, Value(zmin).value, Value(zmax).value)),
  move: (xyz) => libfiveVal(move(value, TVec3(...xyz))),
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

const box = {
  mitered: (a_, b_, center = true) => {
    const isCentered = b_ === undefined || center;
    const a = TVec3(...a_);
    const b = b_ === undefined ? TVec3(0,0,0) : TVec3(...b_);
    return libfiveVal((isCentered ? box_mitered_centered : box_mitered)(a, b));
  },
  exact: (a_, b_, center = true) => {
    const isCentered = b_ === undefined || center;
    const a = TVec3(...a_);
    const b = b_ === undefined ? TVec3(0,0,0) : TVec3(...b_);
    return libfiveVal((isCentered ? box_exact_centered : box_exact)(a, b));
  },
  smooth: (a_, b_, r, center = true) => {
    if (center) throw new Error("No center implemented for box.rounded!");
    const a = TVec3(...a_);
    const b = TVec3(...b_);
    return libfiveVal(rounded_box(a, b, Value(r).value));
  },
  roundedZ: (a_, b_, r_, center = true) => {
    const isCentered = b_ === undefined || Array.isArray(b_) === false || center;
    let a;
    let b;
    let r = Value(isCentered ? b_ : r).value;
    if (isCentered) {
      a = a_.div(-2);
      b = b_ === undefined ? [0,0,0] : a_.div(2);
    } else {
      a = a_;
      b = b_ === undefined ? [0,0,0] : b_;
    }
    let h = Math.abs(a[2] - b[2]);
    return libfiveVal(
      extrude_z(
        rounded_rectangle(TVec2(a[0], a[1]), TVec2(b[0], b[1]), r),
        Value(isCentered ? (h / -2) : 0).value,
        Value(isCentered ? (h / 2) : h).value
      )
    );
  },
};

const clamp = (a) => (lower) => (upper) => {
  return max(lower)(min(upper)(a));
};

const mix = (a) => (b) => (h) => {
  return b.mul(h).add(a.mul(Value(1).sub(h)));
};

const blend = {
  smooth: (a, b, m) => {
    const h = (max(m.sub(abs(a.sub(b))))(0.0)).div(m);
    return (min(a)(b)).sub(h.mul(h).mul(m).mul(1.0/4.0));
  },
  smooth2: (d1, d2, k) => {
    const h = clamp(Value(0.5).add(Value(0.5).mul(d2.sub(d1)).div(k)))(0.0)(1.0);
    return mix(d2)(d1)(h).sub(k.mul(h).mul(Value(1.0).sub(h)));
  },
  difference2: (d1, d2, k) => {
    const h = clamp(Value(0.5).sub(Value(0.5).mul(d2.add(d1)).div(k)))(0.0)(1.0);
    return mix(d2)(neg(d1))(h).add(k.mul(h).mul(Value(1.0).sub(h)));
  },
};

const mag3 = (x,y,z) => sqrt(x.square().add(y.square()).add(z.square()));

const ellipsoid = (wlh_) => {
  const wlh = wlh_.div(2);
  const [x,y,z] = [X(),Y(),Z()];
  const k0 = mag3(x.div(wlh[0]), y.div(wlh[1]), z.div(wlh[2]));
  const k1 = mag3(x.div(wlh[0]**2), y.div(wlh[1]**2), z.div(wlh[2]**2));
  return k0.mul(k0.sub(1.0)).div(k1);
};

const sphere_ = (d) => libfiveVal(sphere(Value(d/2).value, TVec3(0,0,0)));

const triangle_ = (a, b, c) => libfiveVal(
  triangle(TVec2(...a), TVec2(...b), TVec2(...c))
);

const cylinder = (d, h) => libfiveVal(cylinder_z(Value(d/2).value, Value(h).value, TVec3(0,0,0)));

const mm = 1;
const cm = 10;

const deg = (1 / 360) * (Math.PI*2);

Array.prototype.add = function(arr) {
  if (Array.isArray(arr)) {
    return arr.map((n, index) => this[index] + n);
  }
  return this.map((n) => n + arr);
};
Array.prototype.sub = function(arr) {
  if (Array.isArray(arr)) {
    return arr.map((n, index) => this[index] - n);
  }
  return this.map((n) => n - arr);
};
Array.prototype.div = function(arr) {
  if (Array.isArray(arr)) {
    return arr.map((n, index) => this[index] / n);
  }
  return this.map((n) => n / arr);
};
Array.prototype.mul = function(arr) {
  if (Array.isArray(arr)) {
    return arr.map((n, index) => this[index] * n);
  }
  return this.map((n) => n * arr);
};
Array.prototype.neg = function() {
  return this.map((n) => -n);
};

module.exports = {
  mm,
  cm,
  deg,
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
  TVec2,
  TVec3,
  Vec3,
  Region3,
  saveAsSTL,
  toMesh,
  toMeshCoords,
  libfiveVal,
  emptiness,
  ellipsoid,
  sphere: sphere_,
  atan2,
  triangle: triangle_,
  cylinder,
};
