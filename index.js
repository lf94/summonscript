const koffi = require('koffi');

const {
  libfive_opcode_enum, libfive_opcode_tree, libfive_tree_eval_f, libfive_tree_print,
  libfive_tree_unary, libfive_tree_const, libfive_tree_binary, libfive_tree_remap,
  libfive_tree_x, libfive_tree_y, libfive_tree_z, libfive_tree_render_mesh,
  libfive_tree_render_mesh_coords, libfive_tree_save_mesh, libfive_tree_delete,
  libfive_tree_save_slice,
} = require("./libfive.js");

const {
  union, difference, intersection, symmetric_x,
  symmetric_y, symmetric_z, reflect_x, reflect_y, reflect_z, reflect_xy, reflect_yz,
  reflect_xz, emptiness, scale_x, scale_y, scale_z, sphere, 
  scale_xyz, move, rotate_z,   twirl_x, twirl_y, twirl_z, array_x, triangle, extrude_z, offset, cylinder_z,
  rotate_y, rotate_x, rounded_rectangle, inverse, taper_xy_z, text
} = require("./libfive-stdlib.js");

//
// Our wrapper API
// 
// It's typical to want to avoid touching core JS prototypes, but for code CAD
// this is pretty necessary in order to ease translating and understanding of
// routines across different languages, like GLSL or OpenSCAD.
// 
const toLibfiveTree = (a) => {
  return typeof a === "number" ? libfive_tree_const(a) : a;
};

// Wire up the unary and binary operations
const unary = (name) => (a_) => {
  const a = fromLibfiveValue(a_);

  if (a instanceof Array) {
    return toLibfiveValue(a.map((v) => {
      return toLibfiveValue(libfive_tree_unary(libfive_opcode_enum(name), toLibfiveTree(fromLibfiveValue(v))));
    }));
  } else {
    return toLibfiveValue(libfive_tree_unary(libfive_opcode_enum(name), toLibfiveTree(a)));
  }
};

const binary = (name) => (a_, b_) => {
  const a = fromLibfiveValue(a_);
  const b = fromLibfiveValue(b_);

  if (a instanceof Array && b instanceof Array) {
    if (a.length != b.length) {
      throw new Error("Lengths of the Array arguments must be the same.");
    }

    return toLibfiveValue(a.map((v1, idx) => {
      return toLibfiveValue(
        libfive_tree_binary(
          libfive_opcode_enum(name),
          toLibfiveTree(fromLibfiveValue(v1)),
          toLibfiveTree(fromLibfiveValue(b[idx]))
        )
      );
    }));
  }

  if (a instanceof Array) {
    return toLibfiveValue(a.map((v1) => {
      return toLibfiveValue(
        libfive_tree_binary(
          libfive_opcode_enum(name),
          toLibfiveTree(fromLibfiveValue(v1)),
          toLibfiveTree(b)
        )
      );
    }));
  }

  if (b instanceof Array) {
    return toLibfiveValue(b.map((v2) => {
      return toLibfiveValue(
        libfive_tree_binary(
          libfive_opcode_enum(name),
          toLibfiveTree(a),
          toLibfiveTree(fromLibfiveValue(v2))
        )
      );
    }));
  }

  return toLibfiveValue(libfive_tree_binary(libfive_opcode_enum(name), toLibfiveTree(a), toLibfiveTree(b)));
};

const add = binary("add");
const sub = binary("sub");
const mul = binary("mul");
const div = binary("div");
const mod = binary("mod");
const pow = binary("pow");
const compare = binary("compare");

const square = unary("square");
const neg = unary("neg");
const abs = unary("abs");
const sqrt = unary("sqrt");
const sin = unary("sin");

const min = binary("min");
const max = binary("max");

const atan2 = binary("atan2");

const free = ({ value }) => libfive_tree_delete(value);

const length = (p$) => {
  const ps = fromLibfiveValue(p$);
  const pows$ = ps.map(($p) => $p.pow(2));
  const adds$ = pows$.reduce(($acc, $cur) => $acc.add($cur));
  return sqrt(adds$);
};

const step = (a, b) => {
  return max(compare(b, a).add(1), 1);
};

const toLibfiveValue = (a) => {
  if (a instanceof LibfiveValue) return a;
  if (a instanceof Array) {
    return new LibfiveValue(a.map((x) => toLibfiveValue(x)));
  }
  return new LibfiveValue(a);
};

const fromLibfiveValue = (a_) => a_ instanceof LibfiveValue ? a_.value : a_;

const dot = (a_, b_) => {
  const as = fromLibfiveValue(a_);
  const bs = fromLibfiveValue(b_);

  const muls = as.map((a, idx) => a.mul(bs[idx]));
  const adds = muls.reduce((acc, cur) => acc.add(cur));
  return adds;
};

const fract = (a_) => {
  return a_.mod(1);
};

class LibfiveValue {
  constructor(x) {
    this.value = x;
  }
  add(b) { return add(this, toLibfiveValue(b)); }
  sub(b) { return sub(this, toLibfiveValue(b)); }
  mul(b) { return mul(this, toLibfiveValue(b)); }
  div(b) { return div(this, toLibfiveValue(b)); }
  mod(b) { return mod(this, toLibfiveValue(b)); }
  pow(b) { return pow(this, toLibfiveValue(b)); }
  dot(b) { return dot(this, toLibfiveValue(b)); }
  fract() { return fract(this); }
  square() { return square(this); }
  union(b) { return toLibfiveValue(union(this.value, b.value)); }
  difference(b) { return toLibfiveValue(difference(this.value, b.value)); }
  intersection(b) { return toLibfiveValue(intersection(this.value, b.value)); }
  //inverse: () => toLibfiveValue(inverse(value)),
  offset(o) { return this.sub(o); }
  //blend: (b, m) => blend.smooth2(toLibfiveValue(value), b, Value(m)),
  //blendDifference: (b, m) => blend.difference2(b, toLibfiveValue(value), Value(m)),
  rotateX(radians) { return toLibfiveValue(rotate_x(this.value, toLibfiveTree(radians), TVec3(0,0,0))); }
  rotateY(radians) { return toLibfiveValue(rotate_y(this.value, toLibfiveTree(radians), TVec3(0,0,0))); }
  rotateZ(radians) { return toLibfiveValue(rotate_z(this.value, toLibfiveTree(radians), TVec3(0,0,0))); }
  //symmetricX: () => toLibfiveValue(symmetric_x(value)),
  //symmetricY: () => toLibfiveValue(symmetric_y(value)),
  //symmetricZ: () => toLibfiveValue(symmetric_z(value)),
  scaleX(amount) { return toLibfiveValue(scale_x(this.value, toLibfiveTree(amount), toLibfiveTree(0))); }
  scaleY(amount) { return toLibfiveValue(scale_y(this.value, toLibfiveTree(amount), toLibfiveTree(0))); }
  scaleZ(amount) { return toLibfiveValue(scale_z(this.value, toLibfiveTree(amount), toLibfiveTree(0))); }
  // scaleXYZ: (xyz) => toLibfiveValue(scale_xyz(value, TVec3(...xyz), TVec3(0,0,0))),
  //reflectX: (offset) => toLibfiveValue(reflect_x(value, Value(offset).value)),
  //reflectY: (offset) => toLibfiveValue(reflect_y(value, Value(offset).value)),
  //reflectZ: (offset) => toLibfiveValue(reflect_z(value, Value(offset).value)),
  //reflectXY: () => toLibfiveValue(reflect_xz(value)),
  //reflectYZ: () => toLibfiveValue(reflect_yz(value)),
  //reflectXZ: () => toLibfiveValue(reflect_xz(value)),
  //twirlX: (amount, radius, offset) => toLibfiveValue(twirl_x(value, Value(amount).value, Value(radius).value, TVec3(...offset))),
  //twirlY: (amount, radius, offset) => toLibfiveValue(twirl_y(value, Value(amount).value, Value(radius).value, TVec3(...offset))),
  //twirlZ: (amount, radius, offset) => toLibfiveValue(twirl_z(value, Value(amount).value, Value(radius).value, TVec3(...offset))),
  //taperXYZ: (base, height, scale, baseScale) => toLibfiveValue(taper_xy_z(value, TVec3(...base), Value(height).value, Value(scale).value, Value(baseScale).value)),
  //arrayX: (amount, distanceBetween) => toLibfiveValue(array_x(value, amount, Value(distanceBetween).value)),
  extrudeZ(zmin, zmax) { return toLibfiveValue(extrude_z(this.value, toLibfiveTree(zmin), toLibfiveTree(zmax))); }
  move(xyz) { return toLibfiveValue(move(this.value, TVec3(...xyz))); }
  reify() {
    if (this.value instanceof Array) {
      return this.value.map((t) => libfive_tree_print(t.value));
    }

    return libfive_tree_print(this.value);
  }
};

const X = () => toLibfiveValue(libfive_tree_x());
const Y = () => toLibfiveValue(libfive_tree_y());
const Z = () => toLibfiveValue(libfive_tree_z());
const Value = (value) => toLibfiveValue(libfive_tree_const(value));

const Region3 = (min, max) => ({
  X: { lower: min[0], upper: max[0] },
  Y: { lower: min[1], upper: max[1] },
  Z: { lower: min[2], upper: max[2] },
});

const Region2 = (min, max) => ({
  X: { lower: min[0], upper: max[0] },
  Y: { lower: min[1], upper: max[1] },
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

const saveAsPNG = ({ value }, region, z, resolution, filepath) => {
  const r = Region2(region[0], region[1]);
  return libfive_tree_save_slice(value, r, z, resolution, filepath);
};

const Vec3 = (x, y, z) => ({ x, y, z });
const Vec2 = (x, y) => ({
  x,
  y,
  dot(b/*:TVec2*/) {
  },
  add(b) {
    if (typeof b.x === "number" && typeof b.y === "number") {
      return Vec2(this.x.add(b.x), this.y.add(b.y));
    } else {
      return Vec2(this.x.add(b), this.y.add(b));
    }
  },
  sub(b) {
    if (typeof b.x === "number" && typeof b.y === "number") {
      return Vec2(this.x.sub(b.x), this.y.sub(b.y));
    } else {
      return Vec2(this.x.sub(b), this.y.sub(b));
    }
  },
  mul(b) {
    if (typeof b.x === "number" && typeof b.y === "number") {
      return Vec2(this.x.mul(b.x), this.y.mul(b.y));
    } else {
      return Vec2(this.x.mul(b), this.y.mul(b));
    }
  },
  mod(b) {
    return Vec2(this.x.mod(b), this.y.mod(b));
  },
  apply(fn) {
    return Vec2(fn(this.x), fn(this.y));
  }
});

const TVec2 = (x, y) => ({ x, y });
const TVec3 = (x, y, z) => ({ x: Value(x).value, y: Value(y).value, z: Value(z).value });

const nothing = () => Value(0);

const floor = (a_) => {
  return a_.sub(a_.mod(1));
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

// All from Inigo Iquilez. Yes your name is immortalized.
const circle = (p, d) => {
  return length(p).sub(d.div(2));
};

const box = {
  exact(b$) {
    const p$ = [X(),Y()];
    const d$ = abs(p$).sub(b$.div(2));
    return length(max(d$, 0)).add(min(max(d$.value[0], d$.value[1]), 0));
  },
  rounded(b$, r) {
    return this.exact(b$.sub(r*2)).sub(r);
  },
}

const textFitToArea = (str_, scale, area) => {
  const avgGlyphSize = 0.6*scale; // taken from libfive_stdlib. In the future reimpl the glyphs.
  let strs = [];
  let str = "";
  let x = 0;
  for (let c of str_) {
     x += avgGlyphSize;
     str += c;
     if (x > area[0] && c === " ") {
       strs.push(str);
       str = "";
       x = 0;
     }
  }
  strs.push(str);

  return strs.join("\n");
};

const print2d = (str) => {
  return toLibfiveValue(text(str, TVec2(toLibfiveTree(0),toLibfiveTree(0))));
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
  mod,
  pow,
  square,
  neg,
  abs,
  sqrt,
  sin,
  floor,
  min,
  max,
  step,
  union,
  intersection,
  difference,
  inverse,
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
  Vec2,
  Vec3,
  Region3,
  saveAsSTL,
  saveAsPNG,
  toMesh,
  toMeshCoords,
  emptiness,
  ellipsoid,
  sphere: sphere_,
  atan2,
  triangle: triangle_,
  cylinder,
  toLibfiveValue,
  fract,
  dot,
  sqrt,
  length,
  circle,
  toLibfiveTree,
  print2d,
  textFitToArea,
};
