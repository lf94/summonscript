const { libfive_tree_remap, libfive_tree_x, libfive_tree_y, libfive_tree_z }  = require("../koffi/libfive");
const { toLibfiveTreeConst }  = require("../libfive-helper");
const { Value } = require("../value");
const { atan, atan2, abs, min, max, neg, sqrt, XYZ, cos, sin, clamp, mix, length } = require("./math");

const remap = ($shape, $xyz)  => {
  const xyz = Value.unwrap($xyz);
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

const elongate = ($shape, $xyz)  => {
  const xyz = XYZ();
  const q = Value.unwrap(abs(xyz).sub($xyz.div(2)));
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

const scaleXYZ = ($shape, $xyz) => {
  const [x,y,z] = XYZ();
  return $shape.remap([x.div($xyz[0]), y.div($xyz[1]), z.div($xyz[2])]);
};
exports.scaleXYZ = scaleXYZ;

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
  return sm.remap([x.mul(s), y.mul(s), z]).move($base);
};
exports.taperXYAlongZ = taperXYAlongZ;

const twist = ($shape, $amount) => {
  const $amount_ = new Value($amount);
  const [x,y,z] = XYZ();
  const c = cos($amount_.mul(y));
  const s = sin($amount_.mul(y));
  const q = [
    c.mul(x).add(neg(s).mul(z)),
    s.mul(x).add(c.mul(z)),
    y
  ];
  return $shape.remap(q);
};
exports.twist = twist;

const clearance = ($a, $b, $o) => $a.difference($b.offset($o));
exports.clearance = clearance;

const shell = ($shape, $o) => clearance($shape, $shape, neg(abs($o)));
exports.shell = shell;

const unionSmooth = (a, b, m) => {
  const $m = new Value(m);
  const h = max($m.sub(abs(a.sub(b))), 0.0).div($m);
  return min(a,b).sub(h.mul(h).mul($m).mul(1.0/4.0));
};
module.exports.unionSmooth = unionSmooth;

const differenceSmooth = (d1, d2, k) => {
  return unionSmooth(d1.neg(), d2, k).neg();
};
module.exports.differenceSmooth = differenceSmooth;

const unionRound = ($a, $b, $r) => {
  const r = new Value($r);
  const u = max([r.sub($a), r.sub($b)], [0, 0]);
  return max(r, min($a, $b)).sub(length(u));
};
module.exports.unionRound = unionRound;

const intersectionRound = ($a, $b, $r) => {
  const r = new Value($r);
  const u = max([r.add($a), r.add($b)], [0, 0]);
  return min(r.neg(), max($a, $b)).add(length(u));
};
module.exports.intersectionRound = intersectionRound;

const differenceRound = ($a, $b, $r) => {
  return intersectionRound($a, $b.neg(), $r);
};
module.exports.differenceRound = differenceRound;

const cheapBend = (shape, k) => {
  const [X,Y,Z] = XYZ();
  const c = cos(X.mul(k));
  const s = sin(X.mul(k));
  const q = [
    c.mul(X).add(neg(s).mul(Y)), 
    s.mul(X).add(c.mul(Y)),
    Z,
  ];
  return shape.remap(q);
}
module.exports.cheapBend = cheapBend;

const bendBackle = (shape, c, k) => {
  const [X,Y,Z] = XYZ();
  let y = Y.sub(c[0]);
  let z = Z.sub(c[1]);
  //to polar coordinates
  let ang = atan2(y, z);
  const len = length([y,z]);
  //warp angle with sigmoid function
  ang = ang.sub(ang.div(sqrt(new Value(1).add(ang.mul(ang)))).mul(new Value(1).sub(k)));
  //to cartesian coordiantes
  const pn = [
    X,
    sin(ang).mul(len).add(c[0]),
    cos(ang).mul(len).add(c[1]),
  ];
  return shape.remap(pn);
};
module.exports.bendBackle = bendBackle;
