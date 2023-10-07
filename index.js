const koffi = require('koffi');

const {
  libfive_opcode_enum, libfive_opcode_tree, libfive_tree_eval_f, libfive_tree_print,
  libfive_tree_unary, libfive_tree_const, libfive_tree_binary, libfive_tree_remap,
  libfive_tree_x, libfive_tree_y, libfive_tree_z, libfive_tree_render_mesh,
  libfive_tree_render_mesh_coords, libfive_tree_save_mesh, libfive_tree_delete,
  libfive_tree_save_slice,
} = require("./libfive");

// Unfortunately this one is complex.
const { text } = require("./libfive-stdlib");

const { preview } = require("./utils/preview");

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

//
// Helper functions to use libfive opcodes with our special "LibfiveValue"
// class which allows us to chain together methods and do other cool things
// like track state.
// 
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

//
// Create the functions from the opcodes.
//

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
const cos = unary("cos");

const min = binary("min");
const max = binary("max");

const union = binary("min");
const difference = (a, b) => binary("max")(a, neg(b));
const intersection = binary("max");

const atan2 = binary("atan2");

const free = ({ value }) => libfive_tree_delete(value);

const toLibfiveValue = (a) => {
  if (a instanceof LibfiveValue) return a;
  if (a instanceof Array) {
    return new LibfiveValue(a.map((x) => toLibfiveValue(x)));
  }
  return new LibfiveValue(a);
};

const fromLibfiveValue = (a_) => a_ instanceof LibfiveValue ? a_.value : a_;

//
// Implement many many SDF shapes, transformations and common functions.
// Either taken from libfive_stdlib, or Inigo Iquilez.
//
const length = (ps$) => {
  const ps = fromLibfiveValue(ps$);
  const pows$ = ps.map(($p) => $p.pow(2));
  const adds$ = pows$.reduce(($acc, $cur) => $acc.add($cur));
  return sqrt(adds$);
};

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

const inverse = (a_) => {
  return neg(a_);
};

const move = (shape, base_) => {
  const [x,y,z] = XYZ();
  const base = toLibfiveValue(base_).value;
  return shape.remap(x.sub(base[0]), y.sub(base[1]), z.sub(base[2]));
};

const elongate = (shape, hs) =>  {
  const xyz = XYZ();
  const q = abs(xyz).sub(hs).value;
  const q2 = [max(q[0], 0), max(q[1], 0), max(q[2], 0)];
  return shape.remap(q2[0], q2[1], q2[2]).add(min(max(q[0],max(q[1],q[2])),0.0));
};

const scale_x = (shape, a_) => {
  const [x,y,z] = XYZ();
  const a = toLibfiveValue(a_);
  return shape.remap(x.div(a), y, z);
};

const scale_y = (shape, a_) => {
  const [x,y,z] = XYZ();
  const a = toLibfiveValue(a_);
  return shape.remap(x, y.div(a), z);
};

const scale_z = (shape, a_) => {
  const [x,y,z] = XYZ();
  const a = toLibfiveValue(a_);
  return shape.remap(x, y, z.div(a));
};

const rotate_x = (shape, angle, center) => {
  const [x,y,z] = XYZ();

  const a = shape.move(neg(center));
  return shape.remap(
    x,
    cos(angle).mul(y).add(sin(angle).mul(z)),
    neg(sin(angle)).mul(y).add(cos(angle).mul(z))
  ).move(center);
}

const rotate_y = (shape, angle, center) => {
  const [x,y,z] = XYZ();

  const a = shape.move(neg(center));
  return shape.remap(
    cos(angle).mul(x).add(sin(angle).mul(z)),
    y,
    neg(sin(angle)).mul(x).add(cos(angle).mul(z))
  ).move(center);
}

const rotate_z = (shape, angle, center) => {
  const [x,y,z] = XYZ();

  const a = shape.move(neg(center));
  return shape.remap(
    cos(angle).mul(x).add(sin(angle).mul(y)),
    neg(sin(angle)).mul(x).add(cos(angle).mul(y)),
    z,
  ).move(center);
}

const reflect_x = (shape, x0) => {
  const [x,y,z] = XYZ();
  return shape.remap(x0.mul(2).sub(x), y, z);
};

const reflect_y = (shape, y0) => {
  const [x,y,z] = XYZ();
  return shape.remap(x, y0.mul(2).sub(y), z);
};

const reflect_z = (shape, z0) => {
  const [x,y,z] = XYZ();
  return shape.remap(x, y, z0.mul(2).sub(z));
};

const extrude_z = (shape, zmin_, zmax_) => {
  const [x, y, z] = XYZ();
  const zmin = toLibfiveValue(zmin_);
  const zmax = toLibfiveValue(zmax_);
  return max(shape, max(zmin.sub(z), z.sub(zmax)));
};

const revolve_y = (shape) => {
  const [x, y, z] = XYZ();
  const r = sqrt(x.square().add(z.square()));
  return shape.remap(r, y, z).union(shape.remap(neg(r), y, z));
};

const taper_xy_z = (shape, base_, height_, scale_, base_scale_) => {
  const [x,y,z] = XYZ();
  const base = toLibfiveValue(base_);
  const height = toLibfiveValue(height_);
  const scale = toLibfiveValue(scale_);
  const base_scale = toLibfiveValue(base_scale_);

  const s = height.div(scale.mul(z).add(base_scale.mul(height.sub(z))));
  return shape.move(neg(base)).remap(x.mul(s), y.mul(s), z).move(base);
};

const clearance = (a, b, o_) => {
  const o = toLibfiveValue(o_);
  return difference(a, b.offset(o));
};

const shell = (shape, o_) => {
  const o = toLibfiveValue(o_);
  return clearance(shape, shape, neg(abs(o)));
}

const nothing = () => Value(0);

const floor = (a_) => {
  return a_.sub(a_.mod(1));
};

const clamp = (a, lower, upper) => {
  return max(lower, min(upper,a));
};

const sign = (x) => {
  return clamp(x.mul(toLibfiveValue(1.0).div(abs(x))), -1.0, 1.0);
};

const step = (edge_, x_) => {
  const edge = toLibfiveValue(edge_);
  const x = toLibfiveValue(x_);
  return clamp(sign(x.sub(edge)), 0.0, 1.0);
};

const mix = (a, b, h) => {
  return b.mul(h).add(a.mul(Value(1).sub(h)));
};

const blend = {
  smooth: (a, b, m_) => {
    const m = toLibfiveValue(m_);
    const h = max(m.sub(abs(a.sub(b))), 0.0).div(m);
    return min(a,b).sub(h.mul(h).mul(m).mul(1.0/4.0));
  },
  smooth2: (d1, d2, k) => {
    const h = clamp(Value(0.5).add(Value(0.5).mul(d2.sub(d1)).div(k)), 0.0, 1.0);
    return mix(d2,d1,h).sub(k.mul(h).mul(Value(1.0).sub(h)));
  },
  difference2: (d1, d2, k) => {
    const h = clamp(Value(0.5).sub(Value(0.5).mul(d2.add(d1)).div(k)), 0.0, 1.0);
    return mix(h, d2, neg(d1)).add(k.mul(h).mul(Value(1.0).sub(h)));
  },
};

const mag3 = (x,y,z) => sqrt(x.square().add(y.square()).add(z.square()));

const ellipsoid = (wlh_) => {
  const wlh = wlh_.div(2);
  const [x,y,z] = [X(),Y(),Z()];
  const k0 = mag3(x.div(wlh[0]), y.div(wlh[1]), z.div(wlh[2]));
  const k1 = mag3(x.div(wlh[0]**2), y.div(wlh[1]**2), z.div(wlh[2]**2));
  return k0.mul(k0.sub(1.0).div(k1));
};

const sphere = (d_) => {
  const xyz = XYZ();
  const d = toLibfiveValue(d_);
  return length(xyz).sub(d.div(2));
};

const triangle_ = (a, b, c) => libfiveVal(
  triangle(TVec2(...a), TVec2(...b), TVec2(...c))
);

const half_space = (norm) => {
    const [x,y,z] = XYZ();
    const point = [0,0,0];
    // dot(pos - point, norm)
    return x.sub(point[0]).mul(norm[0])
           .add(y.sub(point[1]).mul(norm[1]))
           .add(z.sub(point[2]).mul(norm[2]));
};

const circle = (d_) => {
  const d$ = toLibfiveValue(d_);
  const p = XYZ();
  return length([p[0], p[1]]).sub(d$.div(2));
};

const cylinder = (h, d) => {
  const p = XYZ();
  const n = Vec2(abs(length([p[0], p[1]])), abs(p[2])).sub(Vec2(d/2, h/2));
  return min(max(n.x,n.y), 0.0).add(length([max(n.x,0.0), max(n.y,0.0)]));
};

const capsule = (h_, d_) => {
  const [x,y,z] = XYZ();
  const h = toLibfiveValue(h_);
  const d = toLibfiveValue(d_);
  const zn = z.sub(clamp(z, 0.0, h));
  return length([x,zn,y]).sub(d.div(2)).move([0,0,h_/-2]);
};

const dot2 = (v) => {
  return v.dot(v);
};

const cone = {
  capped(h, d1, d2) {
    const cyl = cylinder(h, d1);
    //  taperXYZ(base_, height_, scale_, base_scale_)
    return cyl.taperXYZ([0,0,h/-2], h, d2/d1, 1);
  },
  elongated(h, d1, d2, stretches) {
    const cyl = cylinder(h, d1);
    return cyl
      .elongate(stretches)
      .taperXYZ([0,0,h/-2], h, d2/d1, 1);
  },
  rounded(h, d1, d2) {
    return this.capped(h, d1, d2)
      .union(sphere(d1/2).move([0, 0, h/-2]))
      .union(sphere(d2/2).move([0, 0, h/2]));
  }
};

const rectangle = {
  exact(b$) {
    const p$ = [X(),Y()];
    const d$ = abs(p$).sub(b$.div(2));
    return length(max(d$, 0)).add(min(max(d$.value[0], d$.value[1]), 0));
  },

  // TODO: Clean up b$ meaning "wrapped libfive value".
  // I accidentally mixed up r_ and r, causing problems.
  roundedZ(b$, r_) {
    const r = toLibfiveValue(r_);
    return this.exact(b$.sub(r_*2)).sub(r);
  },
}

const box = {
  exact(b$) {
    return rectangle.exact(b$.slice(0, 2))
      .extrudeZ(b$[2]/-2, b$[2]/2);
  },
  roundedZ(b$, r) {
    return rectangle
      .roundedZ(b$.slice(0, 2), r)
      .extrudeZ(b$[2]/-2, b$[2]/2);
  }
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

//
// A special class to add state and chaining.
// This is how you'd normally use the wrapper.
// 

class LibfiveValue {
  constructor(x) {
    this.value = x;
  }

  remap(x, y, z) { return toLibfiveValue(libfive_tree_remap(this.value, x.value, y.value, z.value)); }
  add(b) { return add(this, toLibfiveValue(b)); }
  sub(b) { return sub(this, toLibfiveValue(b)); }
  mul(b) { return mul(this, toLibfiveValue(b)); }
  div(b) { return div(this, toLibfiveValue(b)); }
  mod(b) { return mod(this, toLibfiveValue(b)); }
  pow(b) { return pow(this, toLibfiveValue(b)); }
  dot(b) { return dot(this, toLibfiveValue(b)); }
  fract() { return fract(this); }
  square() { return square(this); }
  union(b) { return union(this, b); }
  difference(b) { return difference(this, b); }
  intersection(b) { return intersection(this, b); }
  inverse() { return inverse(value); }
  offset(o) { return this.sub(o); }
  shell(o) { return shell(this, o); }
  blend(b, m) { return blend.smooth(this, b, m); }
  elongate(h) { return elongate(this, h); }
  blendDifference(b, m) { return blend.difference2(this, b, toLibfiveValue(m)); }
  rotateX(radians) { return rotate_x(this, radians, [0,0,0]); }
  rotateY(radians) { return rotate_y(this, radians, [0,0,0]); }
  rotateZ(radians) { return rotate_z(this, radians, [0,0,0]); }
  //symmetricX: () => toLibfiveValue(symmetric_x(value)),
  //symmetricY: () => toLibfiveValue(symmetric_y(value)),
  //symmetricZ: () => toLibfiveValue(symmetric_z(value)),
  scaleX(amount) { return scale_x(this, amount); }
  scaleY(amount) { return scale_y(this, amount); }
  scaleZ(amount) { return scale_z(this, amount); }
  // scaleXYZ: (xyz) => toLibfiveValue(scale_xyz(value, TVec3(...xyz), TVec3(0,0,0))),
  reflectX(offset) { return reflect_x(this, toLibfiveValue(offset)); }
  reflectY(offset) { return reflect_y(this, toLibfiveValue(offset)); }
  reflectZ(offset) { return reflect_z(this, toLibfiveValue(offset)); }
  //reflectXY: () => toLibfiveValue(reflect_xz(value)),
  //reflectYZ: () => toLibfiveValue(reflect_yz(value)),
  //reflectXZ: () => toLibfiveValue(reflect_xz(value)),
  //twirlX: (amount, radius, offset) => toLibfiveValue(twirl_x(value, Value(amount).value, Value(radius).value, TVec3(...offset))),
  //twirlY: (amount, radius, offset) => toLibfiveValue(twirl_y(value, Value(amount).value, Value(radius).value, TVec3(...offset))),
  twirlZ(amount, radius, offset) { toLibfiveValue(twirl_z(value, Value(amount).value, Value(radius).value, TVec3(...offset))) }
  taperXYZ(base, height, scale, baseScale) {
    return taper_xy_z(this, base, height, scale, baseScale);
  }
  //arrayX: (amount, distanceBetween) => toLibfiveValue(array_x(value, amount, Value(distanceBetween).value)),
  extrudeZ(zmin, zmax) { return extrude_z(this, zmin, zmax); }
  revolveY() { return revolve_y(this); }
  move(xyz) { return move(this, xyz); }
  reify() {
    if (this.value instanceof Array) {
      return this.value.map((t) => libfive_tree_print(t.value));
    }

    return libfive_tree_print(this.value);
  }
  toMesh(bb, res) {
    return libfive_tree_render_mesh(this.value, Region3(bb[0], bb[1]), res );
  }
};

const X = () => toLibfiveValue(libfive_tree_x());
const Y = () => toLibfiveValue(libfive_tree_y());
const Z = () => toLibfiveValue(libfive_tree_z());
const XYZ = () => [X(),Y(),Z()];
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
  dot(b) {
    return dot([this.x,this.y],[b.x,b.y]);
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
  mod,
  pow,
  square,
  neg,
  abs,
  sqrt,
  sin,
  cos,
  floor,
  min,
  max,
  step,
  union,
  intersection,
  difference,
  free,
  X,
  Y,
  Z,
  XYZ,
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
  toMeshCoords,
  ellipsoid,
  sphere,
  atan2,
  triangle: triangle_,
  cylinder,
  cone,
  toLibfiveValue,
  fract,
  dot,
  sqrt,
  length,
  circle,
  toLibfiveTree,
  print2d,
  textFitToArea,
  half_space,
  capsule,
  mag3,
  rectangle,
  clamp,
  mix,
  sign,
  preview,
};
