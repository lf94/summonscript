const koffi = require('koffi');

const {
  libfive_opcode_enum, libfive_tree_print, libfive_tree_unary,
  libfive_tree_const, libfive_tree_binary, libfive_tree_render_mesh,
  libfive_tree_render_mesh_coords, libfive_tree_save_mesh,
  libfive_tree_save_slice,
} = require("./libfive");

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

const toLibfiveValue = (a) => {
  if (a instanceof LibfiveValue) return a;
  if (a instanceof Array) {
    return new LibfiveValue(a.map((x) => toLibfiveValue(x)));
  }
  return new LibfiveValue(a);
};

const fromLibfiveValue = (a_) => a_ instanceof LibfiveValue ? a_.value : a_;

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
// A special class to add state and chaining.
// This is how you'd normally use the wrapper.

const math = require("./lib/math");
const transforms = require("./lib/transforms");

class LibfiveValue {
  constructor(x) { this.value = x; }

  remap(xyz) { return transforms.remap(this, xyz); }
  add(b) { return math.add(this, b); }
  sub(b) { return math.sub(this, b); }
  mul(b) { return math.mul(this, b); }
  div(b) { return math.div(this, b); }
  mod(b) { return math.mod(this, b); }
  pow(b) { return math.pow(this, b); }
  dot(b) { return math.dot(this, b); }
  fract() { return math.fract(this); }
  square() { return math.square(this); }
  union(b) { return transforms.union(this, b); }
  difference(b) { return transforms.difference(this, b); }
  intersection(b) { return transforms.intersection(this, b); }
  inverse() { return math.inverse(value); }
  offset(o) { return this.sub(o); }
  shell(o) { return transforms.shell(this, o); }
  blend(b, m) { return transforms.blend.smooth(this, b, m); }
  elongate(h) { return transforms.elongate(this, h); }
  blendDifference(b, m) { return transforms.blend.difference2(this, b, toLibfiveValue(m)); }
  rotateX(radians) { return transforms.rotateX(this, radians, [0,0,0]); }
  rotateY(radians) { return transforms.rotateY(this, radians, [0,0,0]); }
  rotateZ(radians) { return transforms.rotateZ(this, radians, [0,0,0]); }
  //symmetricX: () => toLibfiveValue(symmetric_x(value)),
  //symmetricY: () => toLibfiveValue(symmetric_y(value)),
  //symmetricZ: () => toLibfiveValue(symmetric_z(value)),
  scaleX(amount) { return transforms.scaleX(this, amount); }
  scaleY(amount) { return transforms.scaleY(this, amount); }
  scaleZ(amount) { return transforms.scaleZ(this, amount); }
  // scaleXYZ: (xyz) => toLibfiveValue(scale_xyz(value, TVec3(...xyz), TVec3(0,0,0))),
  reflectX(offset) { return transforms.reflectX(this, toLibfiveValue(offset)); }
  reflectY(offset) { return transforms.reflectY(this, toLibfiveValue(offset)); }
  reflectZ(offset) { return transforms.reflectZ(this, toLibfiveValue(offset)); }
  //reflectXY: () => reflect_xz(value),
  //reflectYZ: () => reflect_yz(value),
  //reflectXZ: () => reflect_xz(value),
  //twirlX: (amount, radius, offset) => twirl_x(value, amount, radius, TVec3(...offset))),
  //twirlY: (amount, radius, offset) => twirl_y(value, amount, radius, TVec3(...offset))),
  //twirlZ(amount, radius, offset) { toLibfiveValue(twirl_z(value, Value(amount).value, Value(radius).value, TVec3(...offset))) }
  taperXYZ(base, height, scale, baseScale) { return transforms.taperXYAlongZ(this, base, height, scale, baseScale); }
  //arrayX: (amount, distanceBetween) => toLibfiveValue(array_x(value, amount, Value(distanceBetween).value)),
  extrudeZ(zmin, zmax) { return transforms.extrudeZ(this, zmin, zmax); }
  revolveY() { return transforms.revolveY(this); }
  move(xyz) { return transforms.move(this, xyz); }
  reify() {
    if (this.value instanceof Array) {
      return this.value.map((t) => libfive_tree_print(t.value));
    }

    return libfive_tree_print(this.value);
  }
  toMesh(bb, res) {
    return libfive_tree_render_mesh(
      // It's very weird, but nothing().union(...) is necessary to prevent segfault...
      nothing().union(this).value,
      Region3(bb[0], bb[1]),
      res
    );
  }
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

module.exports = {
  unary,
  binary,
  saveAsSTL,
  saveAsPNG,
  toMeshCoords,
  toLibfiveValue,
  toLibfiveTree,
};
