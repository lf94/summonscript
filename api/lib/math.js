import { unary, binary, fromLibfiveValue, toLibfiveValue } from "../index";

//
// Create the functions from the opcodes.
//

const _ = {
  add: binary("add"),
  sub: binary("sub"),
  mul: binary("mul"),
  div: binary("div"),
  mod: binary("mod"),
  pow: binary("pow"),

  neg: unary("neg"),
  inverse($n) { return this.neg($n); }

  abs: unary("abs"),

  square: unary("square"),
  sqrt: unary("sqrt"),

  sin: unary("sin"),
  cos: unary("cos"),
  atan2: binary("atan2"),
  atan: unary("atan"),

  min: binary("min"),
  max: binary("max"),

  // Avoid if you can. Not really portable.
  compare: binary("compare"),

  // Get the fractional part of a number.
  fract($n) { return $n.mod(1); }

  // Get the length/magnitude of a vector.
  length($xyz) {
    // Unwrap the value to get to the array if necessary.
    const xyz = fromLibfiveValue($xyz);
    const raised = xyz.map(($p) => $p.square());
    const adds = raised.reduce(($acc, $cur) => $acc.add($cur));
    return this.sqrt(adds);
  },
  mag($xyz) { return this.length($xyz); }

  floor(n) { return n.sub(n.mod(1)); },
  round(n) { return this.floor(n.add(0.5)); },

  clamp(n, lower, upper) { return max(lower, min(upper, n)); },

  sign(n) { return clamp(n.mul(toLibfiveValue(1.0).div(abs(n))), -1.0, 1.0); },

  step(edge, x) {
    const $x = toLibfiveValue(x);
    return clamp(sign(x.sub(edge)), 0.0, 1.0);
  },

  mix(a, b, h) { return b.mul(h).add(a.mul(toLibfiveValue(1).sub(h))); },

  dot(a, b) {
    const as = fromLibfiveValue(a);
    const bs = fromLibfiveValue(b);

    const muls = as.map((n, idx) => n.mul(bs[idx]));
    const adds = muls.reduce((acc, cur) => acc.add(cur));
    return adds;
  },
  dot2(v) { return v.dot(v); },

  Region3(min, max) {
    return {
      X: { lower: min[0], upper: max[0] },
      Y: { lower: min[1], upper: max[1] },
      Z: { lower: min[2], upper: max[2] },
    };
  },

  Region2(min, max) {
    return {
      X: { lower: min[0], upper: max[0] },
      Y: { lower: min[1], upper: max[1] },
    };
  },

  alignToResolution(x, resolution, isUpper) {
    return (x - (x % (1/resolution))) + ((1/resolution)*(isUpper ? 1 : -1));
  },

  toAlignedRegion3(region, resolution) {
    const r_ = [
      region[0].map((p) => this.alignToResolution(p, resolution, false)),
      region[1].map((p) => this.alignToResolution(p, resolution, true)),
    ];
    return this.Region3(r_[0], r_[1]);
  },

  Vec3(x, y, z) { return { x, y, z }; },

  Vec2(x, y) {
    return {
      x,
      y,
      dot(b) {
        return _.dot([this.x,this.y],[b.x,b.y]);
      },
      add(b) {
        if (typeof b.x === "number" && typeof b.y === "number") {
          return _.Vec2(this.x.add(b.x), this.y.add(b.y));
        } else {
          return _.Vec2(this.x.add(b), this.y.add(b));
        }
      },
      sub(b) {
        if (typeof b.x === "number" && typeof b.y === "number") {
          return _.Vec2(this.x.sub(b.x), this.y.sub(b.y));
        } else {
          return _.Vec2(this.x.sub(b), this.y.sub(b));
        }
      },
      mul(b) {
        if (typeof b.x === "number" && typeof b.y === "number") {
          return _.Vec2(this.x.mul(b.x), this.y.mul(b.y));
        } else {
          return _.Vec2(this.x.mul(b), this.y.mul(b));
        }
      },
      mod(b) {
        return _.Vec2(this.x.mod(b), this.y.mod(b));
      },
      apply(fn) {
        return _.Vec2(fn(this.x), fn(this.y));
      }
    };
  },
};

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

module.exports = _;
