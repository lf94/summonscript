//
// Implement many many SDF shapes, transformations and common functions.
// Either taken from libfive_stdlib, or Inigo Iquilez, or some other genius.

const {
  libfive_tree_x, libfive_tree_y, libfive_tree_z, libfive_tree_remap
} = require("../../libfive");

const { toLibfiveValue, fromLibfiveValue } = require("../index");
const {
  min, max, length, cos, sin, mix, clamp, Vec2, neg, abs, sqrt
} = require("./math");

const X = () => toLibfiveValue(libfive_tree_x());
const Y = () => toLibfiveValue(libfive_tree_y());
const Z = () => toLibfiveValue(libfive_tree_z());
const XYZ = () => [X(),Y(),Z()];

const _ = {
  X,
  Y,
  Z,
  XYZ,

  // Remember, a big positive value is "outside"
  nothing() { return toLibfiveValue(10000000); },

  blend: {
    smooth: (a, b, m) => {
      const $m = toLibfiveValue(m);
      const h = max($m.sub(abs(a.sub(b))), 0.0).div($m);
      return min(a,b).sub(h.mul(h).mul($m).mul(1.0/4.0));
    },
    smooth2: (d1, d2, k) => {
      const $0_5 = toLibfiveValue(0.5);
      const $1_0 = toLibfiveValue(1.0);
      const h = clamp($0_5.add($0_5.mul(d2.sub(d1)).div(k)), 0.0, 1.0);
      return mix(d2,d1,h).sub(k.mul(h).mul($1_0.sub(h)));
    },
    difference2: (d1, d2, k) => {
      const $0_5 = toLibfiveValue(0.5);
      const $1_0 = toLibfiveValue(1.0);
      const h = clamp($0_5.sub($0_5.mul(d2.add(d1)).div(k)), 0.0, 1.0);
      return mix(h, d2, neg(d1)).add(k.mul(h).mul($1_0.sub(h)));
    },
  },

  ellipsoid(wlh){
    const $wlh = toLibfiveValue(wlh).div(2);
    const [x,y,z] = [X(),Y(),Z()];
    const k0 = length([x.div($wlh[0]), y.div($wlh[1]), z.div($wlh[2])]);
    const k1 = length([x.div($wlh[0]**2), y.div($wlh[1]**2), z.div($wlh[2]**2)]);
    return k0.mul(k0.sub(1.0).div(k1));
  },

  sphere(d){
    const $d = toLibfiveValue(d);
    return length(XYZ()).sub($d.div(2));
  },

  halfSpace(norm){
    const [x,y,z] = XYZ();
    const point = [0,0,0];
    // dot(pos - point, norm)
    return x.sub(point[0]).mul(norm[0])
      .add(y.sub(point[1]).mul(norm[1]))
      .add(z.sub(point[2]).mul(norm[2]));
  },

  circle(d){
    const d$ = toLibfiveValue(d);
    const xyz = XYZ();
    return length([xyz[0], xyz[1]]).sub(d$.div(2));
  },

  cylinder(h, d){
    const xyz = XYZ();
    const xy = xyz.slice(0, 2);
    const n = Vec2(abs(length(xy)), abs(p[2])).sub(Vec2(d/2, h/2));
    return min(max(n.x,n.y), 0.0).add(length([max(n.x,0.0), max(n.y,0.0)]));
  },

  capsule(h, d){
    const [x,y,z] = XYZ();
    const $h = toLibfiveValue(h);
    const $d = toLibfiveValue(d);
    const zn = z.sub(clamp(z, 0.0, $h));
    return length([x,zn,y]).sub($d.div(2)).move([0,0,h/-2]);
  },

  cone: {
    capped(h, d1, d2) {
      const cyl = _.cylinder(h, d1);
      //  taperXYZ(base_, height_, scale_, base_scale_)
      return cyl.taperXYZ([0,0,h/-2], h, d2/d1, 1);
    },
    elongated(h, d1, d2, stretches) {
      const cyl = _.cylinder(h, d1);
      return cyl
        .elongate(stretches)
        .taperXYZ([0,0,h/-2], h, d2/d1, 1);
    },
    rounded(h, d1, d2) {
      return this.capped(h, d1, d2)
        .union(_.sphere(d1/2).move([0, 0, h/-2]))
        .union(_.sphere(d2/2).move([0, 0, h/2]));
    }
  },

  rectangle: {
    exact(b$) {
      const p$ = [X(),Y()];
      const d$ = abs(p$).sub(b$.div(2));
      return length(max(d$, 0)).add(min(max(d$.value[0], d$.value[1]), 0));
    },

    // TODO: Clean up b$ meaning "wrapped libfive value".
    // I accidentally mixed up r_ and r, causing problems.
    roundedZ(b$, r_) {
      const r = toLibfiveValue(r_);
      return this.exact(b$.sub(r_*2)).sub(r);
    },
  },

  box: {
    exact(b$) {
      return _.rectangle.exact(b$.slice(0, 2))
        .extrudeZ(b$[2]/-2, b$[2]/2);
    },
    roundedZ(b$, r) {
      return _.rectangle
        .roundedZ(b$.slice(0, 2), r)
        .extrudeZ(b$[2]/-2, b$[2]/2);
    }
  },
};

module.exports = _;
