//
// I also went through libfive_stdlib.h!
// 
const ffi = require("ffi-napi");
const ref = require("ref-napi");
const struct = require("ref-struct-di")(ref);

const func = (d) => ffi.Library("/usr/local/lib/libfive-stdlib", d);

const { libfive_tree } = require("./libfive");

const tfloat = libfive_tree;
exports.tfloat = tfloat;

const tvec2 = struct({
  x: libfive_tree,
  y: libfive_tree,
});
exports.tvec2 = tvec2;

const tvec3 = struct({
  x: libfive_tree,
  y: libfive_tree,
  z: libfive_tree,
});
exports.tvec3 = tvec3;

// Yep, this one has an underscore.
exports.union = func({ "_union": [libfive_tree, [libfive_tree, libfive_tree]] });

exports.intersection = func({ "intersection": [libfive_tree, [libfive_tree, libfive_tree]] });
exports.inverse = func({ "intersection": [libfive_tree, [libfive_tree]] });
exports.difference = func({ "difference": [libfive_tree, [libfive_tree, libfive_tree]] });
exports.offset = func({ "offset": [libfive_tree, [libfive_tree, tfloat]] });
exports.clearance = func({ "clearance": [libfive_tree, [libfive_tree, libfive_tree, tfloat]] });
exports.shell = func({ "shell": [libfive_tree, [libfive_tree, tfloat]] });
exports.blend_expt = func({ "blend_expt": [libfive_tree, [libfive_tree, libfive_tree, tfloat]] });
exports.blend_expt_unit = func({ "blend_expt_unit": [libfive_tree, [libfive_tree, libfive_tree, tfloat]] });
exports.blend_rough = func({ "blend_rough": [libfive_tree, [libfive_tree, libfive_tree, tfloat]] });
exports.blend_difference = func({ "blend_difference": [libfive_tree, [libfive_tree, libfive_tree, tfloat, tfloat]] });
exports.morph = func({ "morph": [libfive_tree, [libfive_tree, libfive_tree, tfloat]] });
exports.loft = func({ "loft": [libfive_tree, [libfive_tree, libfive_tree, tfloat, tfloat]] });
exports.loft_between = func({ "loft_between": [libfive_tree, [libfive_tree, libfive_tree, tvec3, tvec3]] });

exports.circle = func({ "circle": [libfive_tree, [tfloat, tvec2]] });
exports.ring = func({ "ring": [libfive_tree, [tfloat, tfloat, tvec2]] });
exports.polygon = func({ "polygon": [libfive_tree, [tfloat, 'int', tvec2]] });
exports.rectangle = func({ "rectangle": [libfive_tree, [tvec2, tvec2]] });
exports.rounded_rectangle = func({ "rounded_rectangle": [libfive_tree, [tvec2, tvec2, tfloat]] });
exports.rectangle_exact = func({ "rectangle_exact": [libfive_tree, [tvec2, tvec2]] });
exports.rectangle_centered_exact = func({ "rectangle_centered_exact": [libfive_tree, [tvec2, tvec2]] });
exports.triangle = func({ "triangle": [libfive_tree, [tvec2, tvec2, tvec2]] });

exports.box_mitered = func({ "box_mitered": [libfive_tree, [tvec3, tvec3]] });
exports.box_mitered_centered = func({ "box_mitered_centered": [libfive_tree, [tvec3, tvec3]] });
exports.box_exact = func({ "box_exact": [libfive_tree, [tvec3, tvec3]] });
exports.box_exact_centered = func({ "box_exact_centered": [libfive_tree, [tvec3, tvec3]] });
exports.rounded_box = func({ "rounded_box": [libfive_tree, [tvec3, tvec3, tfloat]] });

exports.sphere = func({ "sphere": [libfive_tree, [tfloat, tvec3]] });
exports.half_space = func({ "half_space": [libfive_tree, [tvec3, tvec3]] });
exports.cylinder_z = func({ "cylinder_z": [libfive_tree, [tfloat, tfloat, tvec3]] });
exports.cone_ang_z = func({ "cone_ang_z": [libfive_tree, [tfloat, tfloat, tvec3]] });
exports.cone_z = func({ "cone_z": [libfive_tree, [tfloat, tfloat, tvec3]] });
exports.pyramid_z = func({ "pyramid_z": [libfive_tree, [tvec2, tvec2, tfloat, tfloat]] });
exports.torus_z = func({ "torus_z": [libfive_tree, [tfloat, tfloat, tvec3]] });
exports.gyroid = func({ "gyroid": [libfive_tree, [tvec3, tfloat]] });
exports.emptiness = func({ "emptiness": [libfive_tree, []] });

exports.array_x = func({ "array_x": [libfive_tree, [libfive_tree, 'int', tfloat]] });
exports.array_xy = func({ "array_xy": [libfive_tree, [libfive_tree, 'int', 'int', tvec2]] });
exports.array_xyz = func({ "array_xyz": [libfive_tree, [libfive_tree, 'int', 'int', 'int', tvec3]] });
exports.array_polar_z = func({ "array_polar_z": [libfive_tree, [libfive_tree, 'int', tvec2]] });
exports.extrude_z = func({ "extrude_z": [libfive_tree, [libfive_tree, tfloat, tfloat]] });

exports.move = func({ "move": [libfive_tree, [libfive_tree, tvec3]] });
exports.reflect_x = func({ "reflect_x": [libfive_tree, [libfive_tree, tfloat]] });
exports.reflect_y = func({ "reflect_y": [libfive_tree, [libfive_tree, tfloat]] });
exports.reflect_z = func({ "reflect_z": [libfive_tree, [libfive_tree, tfloat]] });
exports.reflect_xy = func({ "reflect_xy": [libfive_tree, [libfive_tree]] });
exports.reflect_yz = func({ "reflect_yz": [libfive_tree, [libfive_tree]] });
exports.reflect_xz = func({ "reflect_xz": [libfive_tree, [libfive_tree]] });
exports.symmetric_x = func({ "symmetric_x": [libfive_tree, [libfive_tree]] });
exports.symmetric_y = func({ "symmetric_y": [libfive_tree, [libfive_tree]] });
exports.symmetric_z = func({ "symmetric_z": [libfive_tree, [libfive_tree]] });

exports.scale_x = func({ "scale_x": [libfive_tree, [libfive_tree, tfloat, tfloat]] });
exports.scale_y = func({ "scale_y": [libfive_tree, [libfive_tree, tfloat, tfloat]] });
exports.scale_z = func({ "scale_z": [libfive_tree, [libfive_tree, tfloat, tfloat]] });
exports.scale_xyz = func({ "scale_xyz": [libfive_tree, [libfive_tree, tvec3, tvec3,]] });
exports.rotate_x = func({ "rotate_x": [libfive_tree, [libfive_tree, tfloat, tvec3]] });
exports.rotate_y = func({ "rotate_y": [libfive_tree, [libfive_tree, tfloat, tvec3]] });
exports.rotate_z = func({ "rotate_z": [libfive_tree, [libfive_tree, tfloat, tvec3]] });
exports.taper_x_y = func({ "taper_x_y": [libfive_tree, [libfive_tree, tvec2, tfloat, tfloat, tfloat]] });
exports.taper_xy_z = func({ "taper_xy_z": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat, tfloat]] });
exports.shear_x_y = func({ "shear_x_y": [libfive_tree, [libfive_tree, tvec2, tfloat, tfloat, tfloat]] });
exports.repel = func({ "repel": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.repel_x = func({ "repel_x": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.repel_y = func({ "repel_y": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.repel_z = func({ "repel_z": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.repel_xy = func({ "repel_xy": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.repel_yz = func({ "repel_yz": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.repel_xz = func({ "repel_xz": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.attract = func({ "attract": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.attract_x = func({ "attract_x": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.attract_y = func({ "attract_y": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.attract_z = func({ "attract_z": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.attract_xy = func({ "attract_xy": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.attract_yz = func({ "attract_yz": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.attract_xz = func({ "attract_xz": [libfive_tree, [libfive_tree, tvec3, tfloat, tfloat]] });
exports.revolve_y = func({ "revolve_y": [libfive_tree, [libfive_tree, tfloat]] });
exports.twirl_x = func({ "twirl_x": [libfive_tree, [libfive_tree, tfloat, tfloat, tvec3]] });
exports.twirl_axis_x = func({ "twirl_axis_x": [libfive_tree, [libfive_tree, tfloat, tfloat, tvec3]] });
exports.twirl_y = func({ "twirl_y": [libfive_tree, [libfive_tree, tfloat, tfloat, tvec3]] });
exports.twirl_axis_y = func({ "twirl_axis_y": [libfive_tree, [libfive_tree, tfloat, tfloat, tvec3]] });
exports.twirl_z = func({ "twirl_z": [libfive_tree, [libfive_tree, tfloat, tfloat, tvec3]] });
exports.twirl_axis_z = func({ "twirl_axis_z": [libfive_tree, [libfive_tree, tfloat, tfloat, tvec3]] });

exports.text = func({ "text": [libfive_tree, [ref.refType('char'), tvec2]] });
