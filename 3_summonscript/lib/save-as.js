const { libfive_tree_save_mesh, libfive_tree_save_slice } = require("../ffi-napi/libfive");
const { toAlignedRegion3, Region2 } = require("./math");

const stl = ({ value }, region, resolution, filepath) => {
  const r = toAlignedRegion3(region, resolution);
  return libfive_tree_save_mesh(value, r, resolution, filepath);
};
module.exports.stl = stl;

const png = ({ value }, region, z, resolution, filepath) => {
  const r = Region2(region[0], region[1]);
  return libfive_tree_save_slice(value, r, z, resolution, filepath);
};
module.exports.png = png;
