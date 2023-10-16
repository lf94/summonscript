const { libfive_tree_remap, libfive_tree_x, libfive_tree_y, libfive_tree_z }  = require("../libfive");
const { toLibfiveTreeConst }  = require("../libfive-helper");
const { Value } = require("../value");
const { abs, min, max, neg, sqrt, XYZ, cos, sin } = require("./math");

const remap = ($shape, $xyz)  => {
  console.log("hi", $xyz);
  const xyz = Value.unwrap($xyz);
  console.log("ok", xyz);
  return new Value(libfive_tree_remap(
    Value.unwrap($shape),
    toLibfiveTreeConst(xyz[0]),
    toLibfiveTreeConst(xyz[1]),
    toLibfiveTreeConst(xyz[2])
  ));
};
exports.remap = remap;

const move = ($shape, $base) => {
  const base = Value.unwrap($base);
  const [x,y,z] = XYZ();
  return $shape.remap([x.sub(base[0]), y.sub(base[1]), z.sub(base[2])]);
};
exports.move = move;

const elongate = ($shape, $xy)  => {
  const xyz = XYZ();
  const q = Value.unwrap(abs(xyz).sub($xy));
  const q2 = [max(q[0], 0), max(q[1], 0), max(q[2], 0)];
  return $shape.remap([q2[0], q2[1], q2[2]]).add(min(max(q[0],max(q[1],q[2])),0.0));
};
exports.elongate = elongate;

const scaleX = ($shape, $a) => {
  const [x,y,z] = XYZ();
  return $shape.remap([x.div($a), y, z]);
};
exports.scaleX = scaleX;

const scaleY = ($shape, $a) => {
  const [x,y,z] = XYZ();
  return $shape.remap([x, y.div($a), z]);
};
exports.scaleY = scaleY;

const scaleZ = ($shape, $a) => {
  const [x,y,z] = XYZ();
  return $shape.remap([x, y, z.div($a)]);
};
exports.scaleZ = scaleZ;

const rotateX = ($shape, $angle, $center = [0, 0, 0]) => {
  const [x,y,z] = XYZ();

  const a = $shape.move(neg($center));
  return $shape.remap([
    x,
    cos($angle).mul(y).add(sin($angle).mul(z)),
    neg(sin($angle)).mul(y).add(cos($angle).mul(z))
  ]).move($center);
};
exports.rotateX = rotateX;

const rotateY = ($shape, angle, center = [0,0,0]) => {
  const [x,y,z] = XYZ();

  const a = $shape.move(neg(center));
  return $shape.remap([
    cos(angle).mul(x).add(sin(angle).mul(z)),
    y,
    neg(sin(angle)).mul(x).add(cos(angle).mul(z))
  ]).move(center);
};
exports.rotateY = rotateY;

const rotateZ = ($shape, angle, center = [0, 0, 0]) => {
  const [x,y,z] = XYZ();

  const a = $shape.move(neg(center));
  return $shape.remap([
    cos(angle).mul(x).add(sin(angle).mul(y)),
    neg(sin(angle)).mul(x).add(cos(angle).mul(y)),
    z,
  ]).move(center);
};
exports.rotateZ = rotateZ;

const reflectX = ($shape, x0) => {
  const [x,y,z] = XYZ();
  return $shape.remap([x0.mul(2).sub(x), y, z]);
};
exports.reflectX = reflectX;

const reflectY = ($shape, y0) => {
  const [x,y,z] = XYZ();
  return $shape.remap([x, y0.mul(2).sub(y), z]);
};
exports.reflectY = reflectY;

const reflectZ = ($shape, z0) => {
  const [x,y,z] = XYZ();
  return $shape.remap([x, y, z0.mul(2).sub(z)]);
};
exports.reflectZ = reflectZ;

const extrudeZ = ($shape, zmin, zmax) => {
  const [x, y, z] = XYZ();
  const $zmin = new Value(zmin);
  return max($shape, max($zmin.sub(z), z.sub(zmax)));
};
exports.extrudeZ = extrudeZ;

const revolveY = ($shape, ) => {
  const [x, y, z] = XYZ();
  const r = sqrt(x.square().add(z.square()));
  return $shape.remap([r, y, z]).union($shape.remap([neg(r), y, z]));
};
exports.revolveY = revolveY;

const taperXYAlongZ = ($shape, $base, $height, $scale, $baseScale) => {
  const [x,y,z] = XYZ();
  const $height_ = new Value($height);
  const $scale_ = new Value($scale);
  const $baseScale_ = new Value($baseScale);

  const s = $height_.div($scale_.mul(z).add($baseScale_.mul($height_.sub(z))));
  const sm = $shape.move(neg($base));
  console.log(1, sm);
  return sm.remap([x.mul(s), y.mul(s), z]).move($base);
};
exports.taperXYAlongZ = taperXYAlongZ;

const clearance = ($a, $b, $o) => $a.difference($b.offset($o));
exports.clearance = clearance;

const shell = ($shape, $o) => clearance($shape, $shape, neg(abs($o)));
exports.shell = shell;

const blend = {
  smooth: (a, b, m) => {
    const $m = new Value(m);
    const h = max($m.sub(abs(a.sub(b))), 0.0).div($m);
    return min(a,b).sub(h.mul(h).mul($m).mul(1.0/4.0));
  },
  smooth2: (d1, d2, k) => {
    const $0_5 = new Value(0.5);
    const $1_0 = new Value(1.0);
    const h = clamp($0_5.add($0_5.mul(d2.sub(d1)).div(k)), 0.0, 1.0);
    return mix(d2,d1,h).sub(k.mul(h).mul($1_0.sub(h)));
  },
  difference2: (d1, d2, k) => {
    const $0_5 = new Value(0.5);
    const $1_0 = new Value(1.0);
    const h = clamp($0_5.sub($0_5.mul(d2.add(d1)).div(k)), 0.0, 1.0);
    return mix(h, d2, neg(d1)).add(k.mul(h).mul($1_0.sub(h)));
  },
};
module.exports.blend = blend;
