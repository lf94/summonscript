//
// Implement many many SDF shapes, transformations and common functions.
// Either taken from libfive_stdlib, or Inigo Iquilez, or some other genius.
//

const { Value } = require("../value");

const {
  dot, gt, min, max, length, cos, sin, mix, clamp, sign, Vec2, neg, abs, sqrt, XYZ
} = require("./math");

// Remember, a big positive value is "outside"
const nothing = () => new Value(10000000);
exports.nothing = nothing;

const ellipsoid = (wlh) => {
  const $wlh = new Value(wlh).div(2);
  const [x,y,z] = [XYZ()];
  const k0 = length([x.div($wlh[0]), y.div($wlh[1]), z.div($wlh[2])]);
  const k1 = length([x.div($wlh[0]**2), y.div($wlh[1]**2), z.div($wlh[2]**2)]);
  return k0.mul(k0.sub(1.0).div(k1));
};
exports.ellipsoid = ellipsoid;

const sphere = (d) => {
  const $d = new Value(d);
  return length(XYZ()).sub($d.div(2));
};
exports.sphere = sphere;

const halfSpace = (norm) => {
  const [x,y,z] = XYZ();
  const point = [0,0,0];
  // dot(pos - point, norm)
  return x.sub(point[0]).mul(norm[0])
    .add(y.sub(point[1]).mul(norm[1]))
    .add(z.sub(point[2]).mul(norm[2]));
};
exports.halfSpace = halfSpace;

const circle = (d) => {
  const d$ = new Value(d);
  const xyz = XYZ();
  return length([xyz[0], xyz[1]]).sub(d$.div(2));
};
exports.circle = circle;

const cylinder = (h, d) => {
  const xyz = XYZ();
  const n = Vec2(abs(length([xyz[0], xyz[1]])), abs(xyz[2])).sub(Vec2(d/2, h/2));
  return min(max(n.x,n.y), 0.0).add(length([max(n.x,0.0), max(n.y,0.0)]));
};
exports.cylinder = cylinder;

const capsule = (h, d) => {
  const [x,y,z] = XYZ();
  const $h = new Value(h);
  const $d = new Value(d);
  const zn = z.sub(clamp(z, 0.0, $h));
  return length([x,zn,y]).sub($d.div(2)).move([0,0,h/-2]);
};
exports.capsule = capsule;

const cone = {
  capped(h, d1, d2) {
    const cyl = cylinder(h, d1);
    //  taperXYAlongZ(base_, height_, scale_, base_scale_)
    return cyl.taperXYAlongZ([0,0,h/-2], h, d2/d1, 1);
  },
  elongate(h, d1, d2, stretches) {
    const cyl = cylinder(h, d1);
    return cyl
      .elongate(stretches)
      .taperXYAlongZ([0,0,h/-2], h, d2/d1, 1);
  },
  rounded(h, d1, d2) {
    return this.capped(h, d1, d2)
      .union(sphere(d1/2).move([0, 0, h/-2]))
      .union(sphere(d2/2).move([0, 0, h/2]));
  }
};
exports.cone = cone;

const rectangle = {
  exact(b$) {
    const p$ = XYZ().slice(0, 2);
    const d$ = abs(p$).sub(b$.div(2));
    return length(max(d$, 0)).add(min(max(d$.value[0], d$.value[1]), 0));
  },

  // TODO: Clean up b$ meaning "wrapped libfive value".
  // I accidentally mixed up r_ and r, causing problems.
  roundedZ(b$, r_) {
    const r = new Value(r_);
    return this.exact(b$.sub(r_*2)).sub(r);
  },
};
exports.rectangle = rectangle;

const box = (wlh, r = 0) => {
  const xyz = XYZ();
 //  vec3 q = abs(p) - b;
 //  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
  const q = abs(xyz).sub(wlh.div(2)).value;
  const m = max(q, [0,0,0]);
  return length(m).add(min(max(q[0], max(q[1], q[2])), 0.0)).sub(r);
};
exports.box = box;
const cube = box;
exports.cube = cube;

const gyroid = () => { 
  const [x, y, z] = XYZ();
  return cos(x).mul(sin(y)).add(cos(y).mul(sin(z))).add(cos(z).mul(sin(x)));
};
exports.gyroid = gyroid;

const torus = (t) => {
  const [x,y,z] = XYZ();
  const q = [length([x,z]).sub(t[0]), y];
  return length(q).sub(t[1]);
}
exports.torus = torus;

const cappedTorus = (ang, _ra, _rb) => {
  const [x,y,z] = XYZ();
  const nx = abs(x);
  const ra = new Value(_ra);
  const rb = new Value(_rb);
  const sc = [sin(ang/2), cos(ang/2)];

  const a = gt(new Value(sc[1]).mul(nx), new Value(sc[0]).mul(y));
  const b = gt(new Value(sc[0]).mul(y),  new Value(sc[1]).mul(nx));
  const k = max(a.mul(dot([nx, y], sc)), b.mul(length([nx, y])));

  return sqrt(dot([nx,y,z],[nx,y,z]).add(ra.mul(ra)).sub(new Value(2.0).mul(ra).mul(k))).sub(rb);
}
exports.cappedTorus = cappedTorus;

const hexagon = (_d) => {
  const r = _d / 2.0;
  const [X,Y,_Z] = XYZ()
  let p = [X,Y]
  const k = [-0.866025404, 0.5, 0.577350269];
  p = abs(p);
  p = p.sub(min(dot(k.slice(0, 2), p), 0.0).mul(k.slice(0, 2)).mul(2.0));
  p = p.sub([clamp(p.value[0], -k[2]*r, k[2]*r), r]);
  return length(p).mul(sign(p.value[1]));
}
exports.hexagon = hexagon;
