const { libfive_tree_x, libfive_tree_y, libfive_tree_z  } = require("../koffi/libfive");
const { toUnaryOp, toBinaryOp } = require("../libfive-helper");
const { Value } = require("../value");

const X = () => new Value(libfive_tree_x());
const Y = () => new Value(libfive_tree_y());
const Z = () => new Value(libfive_tree_z());

const XYZ = () => [X(),Y(),Z()];
exports.XYZ = XYZ;

const add = ($a, $b) => new Value(toBinaryOp("add")(Value.unwrap($a), Value.unwrap($b)));
exports.add = add;
const sub = ($a, $b) => new Value(toBinaryOp("sub")(Value.unwrap($a), Value.unwrap($b)));
exports.sub = sub;
const mul = ($a, $b) => new Value(toBinaryOp("mul")(Value.unwrap($a), Value.unwrap($b)));
exports.mul = mul;
const div = ($a, $b) => new Value(toBinaryOp("div")(Value.unwrap($a), Value.unwrap($b)));
exports.div = div;
const mod = ($a, $b) => new Value(toBinaryOp("mod")(Value.unwrap($a), Value.unwrap($b)));
exports.mod = mod;
const pow = ($a, $b) => new Value(toBinaryOp("pow")(Value.unwrap($a), Value.unwrap($b)));
exports.pow = pow;
const square = ($a) => new Value(toUnaryOp("square")(Value.unwrap($a)));
exports.square = square;
const neg = ($a) => new Value(toUnaryOp("neg")(Value.unwrap($a)));
exports.neg = neg;

const abs = ($a) => new Value(toUnaryOp("abs")(Value.unwrap($a)));
exports.abs = abs;

const sin = ($a) => new Value(toUnaryOp("sin")(Value.unwrap($a)));
exports.sin = sin;

const cos = ($a) => new Value(toUnaryOp("cos")(Value.unwrap($a)));
exports.cos = cos;

const atan2 = ($a, $b) => new Value(toBinaryOp("atan2")(Value.unwrap($a), Value.unwrap($b)));
exports.atan2 = atan2;

const atan = ($a) => new Value(toUnaryOp("atan")(Value.unwrap($a)));
exports.atan = atan;

const min = ($a, $b) => new Value(toBinaryOp("min")(Value.unwrap($a), Value.unwrap($b)));
exports.min = min;
const max = ($a, $b) => new Value(toBinaryOp("max")(Value.unwrap($a), Value.unwrap($b)));
exports.max = max;

const sqrt = (a) => new Value(toUnaryOp("sqrt")(Value.unwrap(a)));
exports.sqrt = sqrt;

// Avoid if you can. Not really portable.
const compare = (a, b) => new Value(toBinaryOp("compare")(Value.unwrap(a), Value.unwrap(b)));
exports.compare = compare;

// Get the length/magnitude of a vector.
const length = ($xyz) => {
  // Unwrap the value to get to the array if necessary.
  const raised = Value.unwrap($xyz).map((p) => new Value(p).square());
  const adds = raised.reduce(($acc, $cur) => $acc.add($cur));
  return this.sqrt(adds);
};
exports.length = length;
const mag = length;
exports.mag = mag;

const floor = ($n) => $n.sub($n.mod(1));
exports.floor = floor;
const round = ($n) => floor($n.add(0.5));
exports.round = round;

const clamp = ($n, $lower, $upper) => max($lower, min($upper, $n));
exports.clamp = clamp;

const sign = ($n) => clamp($n.mul(new Value(1.0).div(abs($n))), -1.0, 1.0);
exports.sign = sign;

const step = ($edge, $x) => {
  return clamp(sign(new Value($x).sub($edge)), 0.0, 1.0);
};
exports.step = step;

const mix = ($a, $b, $h) => new Value($b).mul($h)
  .add(
    new Value($a).mul(toValue(1).sub($h))
  );
exports.mix = mix;

const dot = ($a, $b) => {
  const as = Value.unwrap($a);
  const bs = Value.unwrap($b);

  const muls = as.map((a, idx) => new Value(a).mul(bs[idx]));
  const $adds = muls.reduce(($acc, $cur) => $acc.add($cur));
  return $adds;
};
exports.dot = dot;
const dot2 = ($v) => $v.dot($v);
exports.dot2 = dot2;

const Region3 = (min, max) => {
  return {
    X: { lower: min[0], upper: max[0] },
    Y: { lower: min[1], upper: max[1] },
    Z: { lower: min[2], upper: max[2] },
  };
};
exports.Region3 = Region3;

const Region2 = (min, max) => {
  return {
    X: { lower: min[0], upper: max[0] },
    Y: { lower: min[1], upper: max[1] },
  };
};
exports.Region2 = Region2;

const alignToResolution = (x, resolution, isUpper) => {
  return (x - (x % (1/resolution))) + ((1/resolution)*(isUpper ? 1 : -1));
};
exports.alignToResolution = alignToResolution;

const toAlignedRegion3 = (region, resolution) => {
  const r_ = [
    region[0].map((p) => this.alignToResolution(p, resolution, false)),
    region[1].map((p) => this.alignToResolution(p, resolution, true)),
  ];
  return this.Region3(r_[0], r_[1]);
};
exports.toAlignedRegion3 = toAlignedRegion3;

const Vec3 = (x, y, z) => ({ x, y, z });
exports.Vec3 = Vec3;

const Vec2 = (x, y) => ({
  x,
  y,
  dot(b) {
    return dot([this.x,this.y],[b.x,b.y]);
  },
  add(b) {
    if (typeof b.x === "number" && typeof b.y === "number") {
      return Vec2(this.x.add(b.x), this.y.add(b.y));
    } else {
      return Vec2(this.x.add(b), this.y.add(b));
    }
  },
  sub(b) {
    if (typeof b.x === "number" && typeof b.y === "number") {
      return Vec2(this.x.sub(b.x), this.y.sub(b.y));
    } else {
      return Vec2(this.x.sub(b), this.y.sub(b));
    }
  },
  mul(b) {
    if (typeof b.x === "number" && typeof b.y === "number") {
      return Vec2(this.x.mul(b.x), this.y.mul(b.y));
    } else {
      return Vec2(this.x.mul(b), this.y.mul(b));
    }
  },
  mod(b) {
    return Vec2(this.x.mod(b), this.y.mod(b));
  },
  apply(fn) {
    return Vec2(fn(this.x), fn(this.y));
  }
});
exports.Vec2 = Vec2;

//
// It's typical to want to avoid touching core JS prototypes, but for code CAD
// this is pretty necessary in order to ease translating and understanding of
// routines across different languages, like GLSL or OpenSCAD.
// 

Array.prototype.add = function(arr) {
  if (Array.isArray(arr)) {
    return arr.map((n, index) => this[index] + n);
  }
  return this.map((n) => n + arr);
};
Array.prototype.sub = function(arr) {
  if (Array.isArray(arr)) {
    return arr.map((n, index) => this[index] - n);
  }
  return this.map((n) => n - arr);
};
Array.prototype.div = function(arr) {
  if (Array.isArray(arr)) {
    return arr.map((n, index) => this[index] / n);
  }
  return this.map((n) => n / arr);
};
Array.prototype.mul = function(arr) {
  if (Array.isArray(arr)) {
    return arr.map((n, index) => this[index] * n);
  }
  return this.map((n) => n * arr);
};
Array.prototype.neg = function() {
  return this.map((n) => -n);
};
