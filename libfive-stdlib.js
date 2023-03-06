// I also went through libfive_stdlib.h!
// 
const koffi = require('koffi');

let lib;

// Probably have a better way to do library detection.
try {
  lib = koffi.load('./libfive-stdlib.so');
} catch(e) {
  lib = koffi.load('/usr/local/lib/libfive-stdlib.so');
}

module.exports.tfloat = koffi.alias("tfloat", "libfive_tree");

module.exports.tvec2 = koffi.struct("tvec2", {
  x: "libfive_tree",
  y: "libfive_tree",
});

module.exports.tvec3 = koffi.struct("tvec3", {
  x: "libfive_tree",
  y: "libfive_tree",
  z: "libfive_tree",
});

module.exports.union = lib.func("libfive_tree _union(libfive_tree a, libfive_tree b)");
module.exports.intersection = lib.func("libfive_tree intersection(libfive_tree a, libfive_tree b)");
module.exports.inverse = lib.func("libfive_tree intersection(libfive_tree a)");
module.exports.difference = lib.func("libfive_tree difference(libfive_tree a, libfive_tree b)");
module.exports.offset = lib.func("libfive_tree offset(libfive_tree a, tfloat o)");
module.exports.clearance = lib.func("libfive_tree clearance(libfive_tree a, libfive_tree b, tfloat o)");
module.exports.shell = lib.func("libfive_tree shell(libfive_tree a, tfloat o)");
module.exports.blend_expt = lib.func("libfive_tree blend_expt(libfive_tree a, libfive_tree b, tfloat m)");
module.exports.blend_expt_unit = lib.func("libfive_tree blend_expt_unit(libfive_tree a, libfive_tree b, tfloat m)");
module.exports.blend_rough = lib.func("libfive_tree blend_rough(libfive_tree a, libfive_tree b, tfloat m)");
module.exports.blend_difference = lib.func("libfive_tree blend_difference(libfive_tree a, libfive_tree b, tfloat m, tfloat o__0)");
module.exports.morph = lib.func("libfive_tree morph(libfive_tree a, libfive_tree b, tfloat m)");
module.exports.loft = lib.func("libfive_tree loft(libfive_tree a, libfive_tree b, tfloat zmin, tfloat zmax)");
module.exports.loft_between = lib.func("libfive_tree loft_between(libfive_tree a, libfive_tree b, tvec3 lower, tvec3 upper)");

module.exports.circle = lib.func("libfive_tree circle(tfloat r, tvec2 center__0)");
module.exports.ring = lib.func("libfive_tree ring(tfloat ro, tfloat ri, tvec2 center__0)");
module.exports.polygon = lib.func("libfive_tree polygon(tfloat r, int n, tvec2 center__0)");
module.exports.rectangle = lib.func("libfive_tree rectangle(tvec2 a, tvec2 b)");
module.exports.rounded_rectangle = lib.func("libfive_tree rounded_rectangle(tvec2 a, tvec2 b, tfloat r)");
module.exports.rectangle_exact = lib.func("libfive_tree rectangle_exact(tvec2 a, tvec2 b)");
module.exports.rectangle_centered_exact = lib.func("libfive_tree rectangle_centered_exact(tvec2 size, tvec2 center__0)");
module.exports.triangle = lib.func("libfive_tree triangle(tvec2 a, tvec2 b, tvec2 c)");

module.exports.box_mitered = lib.func("libfive_tree box_mitered(tvec3 a, tvec3 b)");
module.exports.box_mitered_centered = lib.func("libfive_tree box_mitered_centered(tvec3 size, tvec3 center)");
module.exports.box_exact = lib.func("libfive_tree box_exact(tvec3 a, tvec3 b)");
module.exports.box_exact_centered = lib.func("libfive_tree box_exact_centered(tvec3 size, tvec3 center)");
module.exports.rounded_box = lib.func("libfive_tree rounded_box(tvec3 a, tvec3 b, tfloat r)");

module.exports.sphere = lib.func("libfive_tree sphere(tfloat radius, tvec3 center__0)");
module.exports.half_space = lib.func("libfive_tree half_space(tvec3 norm, tvec3 point__0)");
module.exports.cylinder_z = lib.func("libfive_tree cylinder_z(tfloat r, tfloat h, tvec3 base__0)");
module.exports.cone_ang_z = lib.func("libfive_tree cone_ang_z(tfloat angle, tfloat height, tvec3 base__0)");
module.exports.cone_z = lib.func("libfive_tree cone_z(tfloat radius, tfloat height, tvec3 base__0)");
module.exports.pyramid_z = lib.func("libfive_tree pyramid_z(tvec2 a, tvec2 b, tfloat zmin, tfloat height)");
module.exports.torus_z = lib.func("libfive_tree torus_z(tfloat ro, tfloat ri, tvec3 center__0)");
module.exports.gyroid = lib.func("libfive_tree gyroid(tvec3 period, tfloat thickness)");
module.exports.emptiness = lib.func("libfive_tree emptiness()");

module.exports.array_x = lib.func("libfive_tree array_x(libfive_tree shape, int nx, tfloat dx)");
module.exports.array_xy = lib.func("libfive_tree array_xy(libfive_tree shape, int nx, int ny, tvec2 delta)");
module.exports.array_xyz = lib.func("libfive_tree array_xyz(libfive_tree shape, int nx, int ny, int nz, tvec3 delta)");
module.exports.array_polar_z = lib.func("libfive_tree array_polar_z(libfive_tree shape, int n, tvec2 center__0)");
module.exports.extrude_z = lib.func("libfive_tree extrude_z(libfive_tree t, tfloat zmin, tfloat zmax)");

module.exports.move = lib.func("libfive_tree move(libfive_tree t, tvec3 offset)");
module.exports.reflect_x = lib.func("libfive_tree reflect_x(libfive_tree t, tfloat x0__0)");
module.exports.reflect_y = lib.func("libfive_tree reflect_y(libfive_tree t, tfloat y0__0)");
module.exports.reflect_z = lib.func("libfive_tree reflect_z(libfive_tree t, tfloat z0__0)");
module.exports.reflect_xy = lib.func("libfive_tree reflect_xy(libfive_tree t)");
module.exports.reflect_yz = lib.func("libfive_tree reflect_yz(libfive_tree t)");
module.exports.reflect_xz = lib.func("libfive_tree reflect_xz(libfive_tree t)");
module.exports.symmetric_x = lib.func("libfive_tree symmetric_x(libfive_tree t)");
module.exports.symmetric_y = lib.func("libfive_tree symmetric_y(libfive_tree t)");
module.exports.symmetric_z = lib.func("libfive_tree symmetric_z(libfive_tree t)");

module.exports.scale_x = lib.func("libfive_tree scale_x(libfive_tree t, tfloat sx, tfloat x0__0)");
module.exports.scale_y = lib.func("libfive_tree scale_y(libfive_tree t, tfloat sy, tfloat y0__0)");
module.exports.scale_z = lib.func("libfive_tree scale_z(libfive_tree t, tfloat sz, tfloat z0__0)");
module.exports.scale_xyz = lib.func("libfive_tree scale_xyz(libfive_tree t, tvec3 s, tvec3 center__0)");
module.exports.rotate_x = lib.func("libfive_tree rotate_x(libfive_tree t, tfloat angle, tvec3 center__0)");
module.exports.rotate_y = lib.func("libfive_tree rotate_y(libfive_tree t, tfloat angle, tvec3 center__0)");
module.exports.rotate_z = lib.func("libfive_tree rotate_z(libfive_tree t, tfloat angle, tvec3 center__0)");
module.exports.taper_x_y = lib.func("libfive_tree taper_x_y(libfive_tree shape, tvec2 base, tfloat h, tfloat scale, tfloat base_scale__1)");
module.exports.taper_xy_z = lib.func("libfive_tree taper_xy_z(libfive_tree shape, tvec3 base, tfloat height, tfloat scale, tfloat base_scale__1)");
module.exports.shear_x_y = lib.func("libfive_tree shear_x_y(libfive_tree t, tvec2 base, tfloat height, tfloat offset, tfloat base_offset__0)");
module.exports.repel = lib.func("libfive_tree repel(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.repel_x = lib.func("libfive_tree repel_x(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.repel_y = lib.func("libfive_tree repel_y(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.repel_z = lib.func("libfive_tree repel_z(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.repel_xy = lib.func("libfive_tree repel_xy(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.repel_yz = lib.func("libfive_tree repel_yz(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.repel_xz = lib.func("libfive_tree repel_xz(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.attract = lib.func("libfive_tree attract(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.attract_x = lib.func("libfive_tree attract_x(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.attract_y = lib.func("libfive_tree attract_y(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.attract_z = lib.func("libfive_tree attract_z(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.attract_xy = lib.func("libfive_tree attract_xy(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.attract_yz = lib.func("libfive_tree attract_yz(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.attract_xz = lib.func("libfive_tree attract_xz(libfive_tree shape, tvec3 locus, tfloat radius, tfloat exaggerate__1)");
module.exports.revolve_y = lib.func("libfive_tree revolve_y(libfive_tree shape, tfloat x0__0)");
module.exports.twirl_x = lib.func("libfive_tree twirl_x(libfive_tree shape, tfloat amount, tfloat radius, tvec3 center__0)");
module.exports.twirl_axis_x = lib.func("libfive_tree twirl_axis_x(libfive_tree shape, tfloat amount, tfloat radius, tvec3 center__0)");
module.exports.twirl_y = lib.func("libfive_tree twirl_y(libfive_tree shape, tfloat amount, tfloat radius, tvec3 center__0)");
module.exports.twirl_axis_y = lib.func("libfive_tree twirl_axis_y(libfive_tree shape, tfloat amount, tfloat radius, tvec3 center__0)");
module.exports.twirl_z = lib.func("libfive_tree twirl_z(libfive_tree shape, tfloat amount, tfloat radius, tvec3 center__0)");
module.exports.twirl_axis_z = lib.func("libfive_tree twirl_axis_z(libfive_tree shape, tfloat amount, tfloat radius, tvec3 center__0)");

module.exports.text = lib.func("libfive_tree text(const char* txt, tvec2 pos__0)");
