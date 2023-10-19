//
// I went through libfive/include/libfive.h and wrote all this out.
// You"re welcome fellow humans.
// 
const ffi = require("ffi-napi");
const ref = require("ref-napi");
const struct = require("ref-struct-di")(ref);

const lib = {};

const libfive_interval = struct({
  lower: "float",
  upper: "float",
});
exports.libfive_interval = libfive_interval;

const libfive_region2 = struct({
  X: libfive_interval,
  Y: libfive_interval,
});
exports.libfive_region2 = libfive_region2;

const libfive_region3 = struct({
  X: libfive_interval,
  Y: libfive_interval,
  Z: libfive_interval,
});
exports.libfive_region3 = libfive_region3;

const libfive_vec2 = struct({
  x: "float",
  y: "float",
});
exports.libfive_vec2 = libfive_vec2;

const libfive_vec3 = struct({
  x: "float",
  y: "float",
  z: "float",
});
exports.libfive_vec3 = libfive_vec3;

const libfive_vec4 = struct({
  x: "float",
  y: "float",
  z: "float",
  w: "float",
});
exports.libfive_vec4 = libfive_vec4;

const libfive_tri = struct({
  a: "uint32",
  b: "uint32",
  c: "uint32",
});
exports.libfive_tri = libfive_tri;

const libfive_contour = struct({
  pts: ref.refType(libfive_vec2),
  count: "uint32",
});
exports.libfive_contour = libfive_contour;

const libfive_contours = struct({
  cs: ref.refType(libfive_contour),
  count: "uint32",
});
exports.libfive_contours = libfive_contours;

const libfive_contour3 = struct({
  pts: ref.refType(libfive_vec3),
  count: "uint32",
});
exports.libfive_contour3 = libfive_contour3;

const libfive_contours3 = struct({
  cs: ref.refType(libfive_contour3),
  count: "uint32",
});
exports.libfive_contours3 = libfive_contours3;

const libfive_mesh = struct({
  verts: ref.refType(libfive_vec3),
  tris: ref.refType(libfive_tri),
  tri_count: "uint32",
  vert_count: "uint32",
});
exports.libfive_mesh = libfive_mesh;

const libfive_mesh_coords = struct({
  verts: ref.refType(libfive_vec3),
  vert_count: "uint32",
  coord_indices: ref.refType("int32"),
  coord_index_count: "uint32",
});
exports.libfive_mesh_coords = libfive_mesh_coords;

const libfive_pixels = struct({
  pixels: ref.refType("bool"),
  width: "uint32",
  height: "uint32",
});
exports.libfive_pixels = libfive_pixels;

lib.libfive_contours_delete = ["void", [ref.refType(libfive_contours)]];
lib.libfive_contours3_delete = ["void", [ref.refType(libfive_contours3)]];
lib.libfive_mesh_delete = ["void", [ref.refType(libfive_mesh)]];
lib.libfive_mesh_coords_delete = ["void", [ref.refType(libfive_mesh_coords)]];
lib.libfive_pixels_delete = ["void", [ref.refType(libfive_pixels)]];
lib.libfive_opcode_enum = ["int", ["string"]];
lib.libfive_opcode_args = ["int", ["int"]];

const libfive_vars = struct({
    vars: ref.refType(ref.refType("void")), // probably wrong :s
    values: ref.refType("float"),
    size: "uint32",
});
exports.libfive_vars = libfive_vars;

lib.libfive_vars_delete = ["void", [ref.refType(libfive_vars)]];

const libfive_tree = ref.refType("void"); // opaque
exports.libfive_tree = libfive_tree;
const libfive_evaluator = ref.refType("void");
exports.libfive_evaluator = libfive_evaluator;

lib.libfive_tree_x = [libfive_tree, []];
lib.libfive_tree_y = [libfive_tree, []];
lib.libfive_tree_z = [libfive_tree, []];
lib.libfive_tree_var = [libfive_tree, []];
lib.libfive_tree_is_var = ["bool", [libfive_tree]];
lib.libfive_tree_const = [libfive_tree, ["float"]];
lib.libfive_tree_get_const = ["float", [libfive_tree, ref.refType("bool")]];
lib.libfive_tree_nullary = [libfive_tree, ["int"]];
lib.libfive_tree_unary = [libfive_tree, ["int", libfive_tree]] ;
lib.libfive_tree_binary = [libfive_tree, ["int", libfive_tree, libfive_tree]];
lib.libfive_tree_id = [ref.refType("void"), [libfive_tree]] ;
lib.libfive_tree_eval_f = ["float", [libfive_tree, libfive_vec3]];
lib.libfive_tree_eval_r = [libfive_interval, [libfive_tree, libfive_region3]] ;
lib.libfive_tree_eval_d = [libfive_vec3, [libfive_tree, libfive_vec3]];
lib.libfive_tree_delete = ["void", [libfive_tree]];
lib.libfive_tree_save = ["bool", [libfive_tree, "string"]];
lib.libfive_tree_load = [libfive_tree, ["string"]];
lib.libfive_tree_remap = [libfive_tree, [libfive_tree, libfive_tree, libfive_tree, libfive_tree]];
lib.libfive_tree_optimized = [libfive_tree, [libfive_tree]];
lib.libfive_tree_print = ["string", [libfive_tree]];
lib.libfive_free_str = ["void", ["string"]];

lib.libfive_tree_render_slice = [ref.refType(libfive_contours), [libfive_tree, libfive_region2, "float", "float"]];
lib.libfive_tree_render_slice3 = [ref.refType(libfive_contours3), [libfive_tree, libfive_region2, "float", "float"]];
lib.libfive_tree_save_slice = ["void", [libfive_tree, libfive_region2, "float", "float", "string"]];
lib.libfive_tree_render_mesh = [ref.refType(libfive_mesh), [libfive_tree, libfive_region3, "float"]];
lib.libfive_tree_render_mesh_coords = [ref.refType(libfive_mesh_coords), [libfive_tree, libfive_region3, "float"]];
lib.libfive_tree_save_mesh = ["bool", [libfive_tree, libfive_region3, "float", "string"]];

lib.libfive_evaluator_save_mesh = ["bool", [ref.refType(libfive_evaluator), libfive_region3, "string"]];
lib.libfive_tree_save_meshes = ["bool", [libfive_tree, libfive_region3, "float", "float", "string"]];
lib.libfive_tree_render_pixels = [ref.refType(libfive_pixels), [ libfive_tree, libfive_region2, "float", "float" ]];
lib.libfive_tree_evaluator = [ref.refType(libfive_evaluator), [libfive_tree, libfive_vars]];
lib.libfive_evaluator_update_vars = ["bool", [ref.refType(libfive_evaluator), libfive_vars]];
lib.libfive_evaluator_delete = ["void", [ref.refType(libfive_evaluator)]];
lib.libfive_git_version = ["string", []];
lib.libfive_git_revision = ["string", []];
lib.libfive_git_branch = ["string", []];

const libFfi = ffi.Library("/usr/local/lib/libfive", lib);

Object.assign(exports, libFfi);
