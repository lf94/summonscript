const { libfive_tree_print, libfive_tree_remap } = require("./koffi/libfive");

class Value {
  constructor(value) {
    this.value = Value.unwrap(value);
    if (value instanceof Value) {
      this.value = value.value;
    } else if (value instanceof Array) {
      this.value = value.map((v) => new Value(v));
    } else {
      this.value = value;
    }
  }

  add($b) { return add(this, $b); }
  sub($b) { return sub(this, $b); }
  mul($b) { return mul(this, $b); }
  div($b) { return div(this, $b); }
  mod($b) { return mod(this, $b); }
  pow($b) { return pow(this, $b); }
  square() { return square(this); }
  neg() { return neg(this); }
  fract() { return this.mod(1); }
  dot($b) { return dot(this, $b); }

  union($b) { return min(this, $b); }
  intersection($b) { return max(this, $b); }
  difference($b) { return this.intersection(neg($b)); }

  unionSmooth($b, $m) { return blend.smooth(this, $b, $m); }

  remap($xyz) { return remap(this, $xyz); }
  move($base) { return move(this, $base); }
  elongate($xy) { return elongate(this, $xy); }
  scaleX($s) { return scaleX(this, $s); }
  scaleY($s) { return scaleY(this, $s); }
  scaleZ($s) { return scaleZ(this, $s); }
  scaleXYZ($xyz) { return scaleXYZ(this, $xyz); }
  rotateX($angle, $center) { return rotateX(this, $angle, $center); }
  rotateY($angle, $center) { return rotateY(this, $angle, $center); }
  rotateZ($angle, $center) { return rotateZ(this, $angle, $center); }
  reflectX($offset) { return reflectX(this, $offset); }
  reflectY($offset) { return reflectY(this, $offset); }
  reflectZ($offset) { return reflectZ(this, $offset); }
  extrudeZ($start, $stop) { return extrudeZ(this, $start, $stop); }
  revolveY() { return revolveY(this); }
  taperXYAlongZ($base, $height, $scale, $baseScale) { return taperXYAlongZ(this, $base, $height, $scale, $baseScale); }
  twist($amount) { return twist(this, $amount); }
  offset($offset) { return this.sub($offset); }
  clearance($a, $b, $offset) { return clearance (this, $a, $b, $offset); }
  shell($offset) { return shell(this, $offset); }

  reify() {
    const value = Value.unwrap(this);
    if (value instanceof Array) {
      return value.map((v) => libfive_tree_print(v));
    }
    return libfive_tree_print(value);
  }

  static unwrap(a) {
    if (a instanceof Array) {
      return a.map(($a) => $a instanceof Value ? $a.value : $a);
    } else {
      return a instanceof Value
        ? a.value instanceof Array
          ? Value.unwrap(a.value)
          : a.value
        : a;
    }
  }
};
exports.Value = Value;

// Include these here so when Value.methods are invoked, these symbols will be
// resolved. This avoids a cyclic dependency.
const {
  min,
  max,
  add,
  sub,
  mul,
  div,
  mod,
  pow,
  square,
  neg,
  dot
} = require("./lib/math");

const {
  remap,
  move,
  elongate,
  scaleX,
  scaleY,
  scaleZ,
  scaleXYZ,
  rotateX,
  rotateY,
  rotateZ,
  reflectX,
  reflectY,
  reflectZ,
  extrudeZ,
  revolveY,
  taperXYAlongZ,
  twist,
  clearance,
  shell,
  blend
} = require("./lib/transform");
