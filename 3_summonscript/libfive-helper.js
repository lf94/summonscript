const {
  libfive_tree_print, libfive_tree_render_mesh, libfive_tree_render_mesh_coords,
  libfive_tree_save_mesh, libfive_tree_save_slice,
  libfive_opcode_enum, libfive_tree_unary, libfive_tree_binary, libfive_tree_const,
  libfive_tree_x, libfive_tree_y, libfive_tree_z
} = require("./koffi/libfive");

const toLibfiveTreeConst = (a) => typeof a === "number" ? libfive_tree_const(a) : a;
exports.toLibfiveTreeConst = toLibfiveTreeConst;

const toUnaryOp = (name) => (a) => {
  const op = (v) =>
    libfive_tree_unary(libfive_opcode_enum(name), toLibfiveTreeConst(v));

  if (a instanceof Array) {
    return a.map(op);
  } else {
    return op(a);
  }
};
exports.toUnaryOp = toUnaryOp;

const toBinaryOp = (name) => (a, b) => {
  const op = (a, b) =>
    libfive_tree_binary(libfive_opcode_enum(name), toLibfiveTreeConst(a), toLibfiveTreeConst(b));

  if (a instanceof Array && b instanceof Array) {
    if (a.length != b.length) {
      throw new Error("Arrays must have same length.");
    }

    return a.map((v1, idx) => op(v1, b[idx]));
  }

  if (a instanceof Array) {
    return a.map((v1) => op(v1, b));
  }
  if (b instanceof Array) {
    return b.map((v2) => op(a, v2));
  }

  // a and b are not array values then.
  return op(a, b);
};
exports.toBinaryOp = toBinaryOp;

