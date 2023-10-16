const {
  libfive_opcode_enum, libfive_opcode_tree, libfive_tree_eval_f, libfive_tree_print,
  libfive_tree_unary, libfive_tree_const, libfive_tree_binary, libfive_tree_remap,
  libfive_tree_x, libfive_tree_y, libfive_tree_z, libfive_tree_render_mesh,
  libfive_tree_render_mesh_coords, libfive_tree_save_mesh, libfive_tree_delete,
  libfive_tree_save_slice,
} = require("./libfive");

const math = require("./lib/math");
const sdf = require("./lib/sdf");

//
// Helper functions to use libfive opcodes with our special "LibfiveValue"
// class which allows us to chain together methods and do other cool things
// like track state.
// 

//
// A special class to add state and chaining.
// This is how you'd normally use the wrapper.

// Anything commented out I just haven't come back to fix after a refactoring.

class LibfiveValue {
  constructor(x) { this.value = x; }

  remap(xyz) { return sdf.remap(this, xyz); }
  add(b) { return math.add(this, b); }
  sub(b) { return math.sub(this, b); }
  mul(b) { return math.mul(this, b); }
  div(b) { return math.div(this, b); }
  mod(b) { return math.mod(this, b); }
  pow(b) { return math.pow(this, b); }
  dot(b) { return math.dot(this, b); }
  fract() { return math.fract(this); }
  square() { return math.square(this); }
  union(b) { return sdf.union(this, b); }
  difference(b) { return sdf.difference(this, b); }
  intersection(b) { return sdf.intersection(this, b); }
  inverse() { return math.inverse(value); }
  offset(o) { return this.sub(o); }
  shell(o) { return sdf.shell(this, o); }
  blend(b, m) { return sdf.blend.smooth(this, b, m); }
  elongate(h) { return sdf.elongate(this, h); }
  blendDifference(b, m) { return sdf.blend.difference2(this, b, m); }
  rotateX(radians) { return sdf.rotateX(this, radians, [0,0,0]); }
  rotateY(radians) { return sdf.rotateY(this, radians, [0,0,0]); }
  rotateZ(radians) { return sdf.rotateZ(this, radians, [0,0,0]); }
  //symmetricX: () => symmetricX(value),
  //symmetricY: () => symmetricY(value),
  //symmetricZ: () => symmetricZ(value),
  scaleX(amount) { return sdf.scaleX(this, amount); }
  scaleY(amount) { return sdf.scaleY(this, amount); }
  scaleZ(amount) { return sdf.scaleZ(this, amount); }
  // scaleXYZ: (xyz) => toLibfiveValue(scaleXYZ(value, TVec3(...xyz), TVec3(0,0,0))),
  reflectX(offset) { return sdf.reflectX(this, offset); }
  reflectY(offset) { return sdf.reflectY(this, offset); }
  reflectZ(offset) { return sdf.reflectZ(this, offset); }
  //reflectXY: () => toLibfiveValue(sdf.reflectXZ(value)),
  //reflectYZ: () => toLibfiveValue(sdf.reflectYZ(value)),
  //reflectXZ: () => toLibfiveValue(sdf.reflectXZ(value)),
  //twirlX: (amount, radius, offset) => toLibfiveValue(sdf.twirlX(value, amount, radius, Vec3(...offset))),
  //twirlY: (amount, radius, offset) => toLibfiveValue(sdf.twirlY(value, amount, radius, Vec3(...offset))),
  twirlZ(amount, radius, offset) { return toLibfiveValue(sdf.twirlZ(value, Value(amount).value, Value(radius).value, TVec3(...offset))); }
  taperXYZ(base, height, scale, baseScale) { return sdf.taperXYAlongZ(this, base, height, scale, baseScale); }
  //arrayX: (amount, distanceBetween) => toLibfiveValue(array_x(value, amount, Value(distanceBetween).value)),
  extrudeZ(zmin, zmax) { return sdf.extrudeZ(this, zmin, zmax); }
  revolveY() { return sdf.revolveY(this); }
  move(xyz) { return sdf.move(this, xyz); }
  reify() {
    if (this.value instanceof Array) {
      return this.value.map((t) => libfive_tree_print(t.value));
    }

    return libfive_tree_print(this.value);
  }
  toMesh(bb, res) {
    return libfive_tree_render_mesh(
      // It's very weird, but nothing().union(...) is necessary to prevent segfault...
      sdf.nothing().union(this).value,
      math.Region3(bb[0], bb[1]),
      res
    );
  }
};

const fromLibfiveValue = (a_) => a_ instanceof LibfiveValue ? a_.value : a_;

const toLibfiveValue = (a) => {
  if (a instanceof LibfiveValue) return a;
  if (a instanceof Array) {
    return new LibfiveValue(a.map((x) => toLibfiveValue(x)));
  }
  return new LibfiveValue(a);
};

const toLibfiveTree = (a) => {
  return typeof a === "number" ? libfive_tree_const(a) : a;
};

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
  toLibfiveValue,
  toLibfiveTree,
  fromLibfiveValue,
  unary,
  binary,
  saveAsSTL,
  saveAsPNG,
  toMeshCoords,
}
