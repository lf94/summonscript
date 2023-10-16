//
// I went through libfive/include/libfive.h and wrote all this out.
// You're welcome fellow humans.
// 
const koffi = require('koffi');

let lib;

try {
  lib = koffi.load('./libfive.so');
} catch(e) {
  lib = koffi.load('/usr/local/lib/libfive.so');
}

module.exports.libfive_interval = koffi.struct('libfive_interval', {
  lower: 'float',
  upper: 'float',
});

module.exports.libfive_region2 = koffi.struct('libfive_region2', {
  X: 'libfive_interval',
  Y: 'libfive_interval',
});

module.exports.libfive_region3 = koffi.struct('libfive_region3', {
  X: 'libfive_interval',
  Y: 'libfive_interval',
  Z: 'libfive_interval',
});

module.exports.libfive_vec2 = koffi.struct('libfive_vec2', {
  x: 'float',
  y: 'float',
});

module.exports.libfive_vec3 = koffi.struct('libfive_vec3', {
  x: 'float',
  y: 'float',
  z: 'float',
});

module.exports.libfive_vec4 = koffi.struct('libfive_vec4', {
  x: 'float',
  y: 'float',
  z: 'float',
  w: 'float',
});

module.exports.libfive_tri = koffi.struct('libfive_tri', {
  a: 'uint32_t',
  b: 'uint32_t',
  c: 'uint32_t',
});

module.exports.libfive_contour = koffi.struct('libfive_contour', {
  pts: 'libfive_vec2*',
  count: 'uint32_t',
});

module.exports.libfive_contours = koffi.struct('libfive_contours', {
  cs: 'libfive_contour*',
  count: 'uint32_t',
});

module.exports.libfive_contour3 = koffi.struct('libfive_contour3', {
  pts: 'libfive_vec3*',
  count: 'uint32_t',
});

module.exports.libfive_contours3 = koffi.struct('libfive_contours3', {
  cs: 'libfive_contour3*',
  count: 'uint32_t',
});

module.exports.libfive_mesh = koffi.struct('libfive_mesh', {
  verts: 'libfive_vec3*',
  tris: 'libfive_tri*',
  tri_count: 'uint32_t',
  vert_count: 'uint32_t',
});

module.exports.libfive_mesh_coords = koffi.struct('libfive_mesh_coords', {
  verts: 'libfive_vec3*',
  vert_count: 'uint32_t',
  coord_indices: 'int32_t*',
  coord_index_count: 'uint32_t',
});

module.exports.libfive_pixels = koffi.struct('libfive_pixels', {
  pixels: 'bool*',
  width: 'uint32_t',
  height: 'uint32_t',
});

module.exports.libfive_contours_delete = lib.func('void libfive_contours_delete(libfive_contours* cs)');
module.exports.libfive_contours3_delete = lib.func('void libfive_contours3_delete(libfive_contours3* cs)');
module.exports.libfive_mesh_delete = lib.func('void libfive_mesh_delete(libfive_mesh* m)');
module.exports.libfive_mesh_coords_delete = lib.func('void libfive_mesh_coords_delete(libfive_mesh_coords* m)');
module.exports.libfive_pixels_delete = lib.func('void libfive_pixels_delete(libfive_pixels* ps)');
module.exports.libfive_opcode_enum = lib.func('int libfive_opcode_enum(const char* op)');
module.exports.libfive_opcode_args = lib.func('int libfive_opcode_args(int op)');

module.exports.libfive_vars = koffi.struct('libfive_vars', {
    vars: 'void* const*',
    values: 'float*',
    size: 'uint32_t',
});
module.exports.libfive_vars_delete = lib.func('void libfive_vars_delete(libfive_vars* j)');

module.exports.libfive_tree = koffi.pointer('libfive_tree', koffi.opaque());
module.exports.libfive_evaluator = koffi.pointer('libfive_evaluator', koffi.opaque());

module.exports.libfive_tree_x = lib.func('libfive_tree libfive_tree_x()');
module.exports.libfive_tree_y = lib.func('libfive_tree libfive_tree_y()');
module.exports.libfive_tree_z = lib.func('libfive_tree libfive_tree_z()');
module.exports.libfive_tree_var = lib.func('libfive_tree libfive_tree_var()');
module.exports.libfive_tree_is_var = lib.func('bool libfive_tree_is_var(libfive_tree t)');
module.exports.libfive_tree_const = lib.func('libfive_tree libfive_tree_const(float f)');
module.exports.libfive_tree_get_const = lib.func('float libfive_tree_get_const(libfive_tree t, _Out_ bool *success)');
module.exports.libfive_tree_nullary = lib.func('libfive_tree libfive_tree_nullary(int op)');
module.exports.libfive_tree_unary = lib.func('libfive_tree libfive_tree_unary(int op, libfive_tree a)');
module.exports.libfive_tree_binary = lib.func('libfive_tree libfive_tree_binary(int op, libfive_tree a, libfive_tree b)');
module.exports.libfive_tree_id = lib.func('const void* libfive_tree_id(libfive_tree t)');
module.exports.libfive_tree_eval_f = lib.func('float libfive_tree_eval_f(libfive_tree t, libfive_vec3 p)');
module.exports.libfive_tree_eval_r = lib.func('libfive_interval libfive_tree_eval_r(libfive_tree t, libfive_region3 r)');
module.exports.libfive_tree_eval_d = lib.func('libfive_vec3 libfive_tree_eval_d(libfive_tree t, libfive_vec3 p)');
module.exports.libfive_tree_delete = lib.func('void libfive_tree_delete(libfive_tree ptr)');
module.exports.libfive_tree_save = lib.func('bool libfive_tree_save(libfive_tree ptr, const char* filename)');
module.exports.libfive_tree_load = lib.func('libfive_tree libfive_tree_load(const char* filename)');
module.exports.libfive_tree_remap = lib.func('libfive_tree libfive_tree_remap(libfive_tree p, libfive_tree x, libfive_tree y, libfive_tree z)');
module.exports.libfive_tree_optimized = lib.func('libfive_tree libfive_tree_optimized(libfive_tree t)');
module.exports.libfive_tree_print = lib.func('char* libfive_tree_print(libfive_tree t)');
module.exports.libfive_free_str = lib.func('void libfive_free_str(char* ptr)');

module.exports.libfive_tree_render_slice = lib.func('libfive_contours* libfive_tree_render_slice(libfive_tree tree, libfive_region2 R, float z, float res)');
module.exports.libfive_tree_render_slice3 = lib.func('libfive_contours3* libfive_tree_render_slice3(libfive_tree tree, libfive_region2 R, float z, float res)');
module.exports.libfive_tree_save_slice = lib.func('void libfive_tree_save_slice(libfive_tree tree, libfive_region2 R, float z, float res, const char* f)');
module.exports.libfive_tree_render_mesh = lib.func('libfive_mesh* libfive_tree_render_mesh(libfive_tree tree, libfive_region3 R, float res)');
module.exports.libfive_tree_render_mesh_coords = lib.func('libfive_mesh_coords* libfive_tree_render_mesh_coords(libfive_tree tree, libfive_region3 R, float res)');
module.exports.libfive_tree_save_mesh = lib.func('bool libfive_tree_save_mesh(libfive_tree tree, libfive_region3 R, float res, const char* f)');

module.exports.libfive_evaluator_save_mesh = lib.func('bool libfive_evaluator_save_mesh(libfive_evaluator* evaluator, libfive_region3 R, const char *f)');
module.exports.libfive_tree_save_meshes = lib.func('bool libfive_tree_save_meshes(libfive_tree trees, libfive_region3 R, float res, float quality, const char* f)');
module.exports.libfive_tree_render_pixels = lib.func('libfive_pixels* libfive_tree_render_pixels(libfive_tree tree, libfive_region2 R, float z, float res)');
module.exports.libfive_tree_evaluator = lib.func('libfive_evaluator* libfive_tree_evaluator(libfive_tree tree, libfive_vars vars)');
module.exports.libfive_evaluator_update_vars = lib.func('bool libfive_evaluator_update_vars(libfive_evaluator* eval_tree, libfive_vars vars)');
module.exports.libfive_evaluator_delete = lib.func('void libfive_evaluator_delete(libfive_evaluator* ptr)');
module.exports.libfive_git_version = lib.func('const char* libfive_git_version(void)');
module.exports.libfive_git_revision = lib.func('const char* libfive_git_revision(void)');
module.exports.libfive_git_branch = lib.func('const char* libfive_git_branch(void)');

