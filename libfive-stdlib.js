// I also went through libfive_stdlib.h!
// 
const koffi = require('koffi');

let lib;

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

/* 
LIBFIVE_STDLIB blend_expt(
    // Blends two shapes by the given amount using exponents
    libfive_tree a, libfive_tree b, tfloat m);
LIBFIVE_STDLIB blend_expt_unit(
    // Blends two shapes by the given amount using exponents,
    // with the blend term adjusted to produce results approximately
    // resembling blend_rough for values between 0 and 1.
    libfive_tree a, libfive_tree b, tfloat m);
LIBFIVE_STDLIB blend_rough(
    // Blends two shapes by the given amount, using a fast-but-rough
    // CSG approximation that may not preserve gradients
    libfive_tree a, libfive_tree b, tfloat m);
LIBFIVE_ALIAS(blend, blend_expt_unit)
LIBFIVE_STDLIB blend_difference(
    // Blends the subtraction of b, with optional offset o,
    // from a, with smoothness m
    libfive_tree a, libfive_tree b,
    tfloat m, tfloat o__0);
LIBFIVE_STDLIB morph(
    // Morphs between two shapes.
    // m = 0 produces a, m = 1 produces b
    libfive_tree a, libfive_tree b, tfloat m);
LIBFIVE_STDLIB loft(
    // Produces a blended loft between a (at zmin) and b (at zmax)
    // a and b should be 2D shapes (i.e. invariant along the z axis)
    libfive_tree a, libfive_tree b, tfloat zmin, tfloat zmax);
LIBFIVE_STDLIB loft_between(
    // Produces a blended loft between a (at lower.z) and b (at upper.z),
    // with XY coordinates remapped to slide between lower.xy and upper.xy.
    // a and b should be 2D shapes (i.e. invariant along the z axis)
    libfive_tree a, libfive_tree b, tvec3 lower, tvec3 upper);
 * /

/*

LIBFIVE_STDLIB circle(
    // A 2D circle with the given radius and optional center
    tfloat r, tvec2 center__0);
LIBFIVE_STDLIB ring(
    // A 2D ring with the given outer/inner radii and optional center
    tfloat ro, tfloat ri, tvec2 center__0);
LIBFIVE_STDLIB polygon(
    // A polygon with center-to-vertex distance r and n sides
    tfloat r, int n, tvec2 center__0);
LIBFIVE_STDLIB rectangle(
    // A rectangle with the given bounding corners
    tvec2 a, tvec2 b);
LIBFIVE_STDLIB rounded_rectangle(
    // A rectangle with rounded corners
    tvec2 a, tvec2 b, tfloat r);
LIBFIVE_STDLIB rectangle_exact(
    // A rectangle from an exact distance field
    tvec2 a, tvec2 b);
LIBFIVE_STDLIB rectangle_centered_exact(
    // An exact-field rectangle at the (optional) center
    tvec2 size, tvec2 center__0);
LIBFIVE_STDLIB triangle(
    // A 2D triangle
    tvec2 a, tvec2 b, tvec2 c);

*/


module.exports.box_mitered = lib.func("libfive_tree box_mitered(tvec3 a, tvec3 b)");
module.exports.box_mitered_centered = lib.func("libfive_tree box_mitered_centered(tvec3 size, tvec3 center)");
module.exports.box_exact = lib.func("libfive_tree box_exact(tvec3 a, tvec3 b)");
module.exports.box_exact_centered = lib.func("libfive_tree box_exact_centered(tvec3 size, tvec3 center)");
module.exports.rounded_box = lib.func("libfive_tree rounded_box(tvec3 a, tvec3 b, tfloat r)");

/*
/home/lee/Code/other/libfive/libfive/stdlib/libfive_stdlib.h:133.1,182.47
LIBFIVE_STDLIB sphere(
    // A sphere with the given radius and (optional) center
    tfloat radius, tvec3 center__0);
LIBFIVE_STDLIB half_space(
    // A plane which divides the world into inside and outside, defined by its
    // normal and a single point on the plane
    tvec3 norm, tvec3 point__0);
LIBFIVE_STDLIB cylinder_z(
    // A cylinder with the given radius and height, extruded from the
    // (optional) base position.
    tfloat r, tfloat h, tvec3 base__0);
LIBFIVE_ALIAS(cylinder, cylinder_z)
LIBFIVE_STDLIB cone_ang_z(
    // A cone defined by its slope angle, height, and (optional) base location
    tfloat angle, tfloat height, tvec3 base__0);
LIBFIVE_ALIAS(cone_ang, cone_ang_z)
LIBFIVE_STDLIB cone_z(
    // A cone defined by its radius, height, and (optional) base location
    tfloat radius, tfloat height, tvec3 base__0);
LIBFIVE_ALIAS(cone, cone_z)
LIBFIVE_STDLIB pyramid_z(
    // A pyramid defined by its base rectangle, lower Z value, and height
    tvec2 a, tvec2 b, tfloat zmin, tfloat height);
LIBFIVE_STDLIB torus_z(
    // A torus with the given outer radius, inner radius, and (optional) center
    tfloat ro, tfloat ri, tvec3 center__0);
LIBFIVE_ALIAS(torus, torus_z)
LIBFIVE_STDLIB gyroid(
    // A volume-filling gyroid with the given periods and thickness
    tvec3 period, tfloat thickness);
LIBFIVE_STDLIB emptiness(
    // A value which is empty everywhere
    );

LIBFIVE_STDLIB array_x(
    // Iterates a part in a 1D array
    libfive_tree shape, int nx, tfloat dx);
LIBFIVE_STDLIB array_xy(
    // Iterates a part in a 2D array
    libfive_tree shape, int nx, int ny, tvec2 delta);
LIBFIVE_STDLIB array_xyz(
    // Iterates a part in a 3D array
    libfive_tree shape, int nx, int ny, int nz, tvec3 delta);
LIBFIVE_STDLIB array_polar_z(
    // Iterates a shape about an optional center position
    libfive_tree shape, int n, tvec2 center__0);
LIBFIVE_ALIAS(array_polar, array_polar_z)
LIBFIVE_STDLIB extrude_z(
    // Extrudes a 2D shape between zmin and zmax
    libfive_tree t, tfloat zmin, tfloat zmax);
*/


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

// Add a ton more transforms.
