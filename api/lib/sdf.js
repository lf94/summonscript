//
// Implement many many SDF shapes, transformations and common functions.
// Either taken from libfive_stdlib, or Inigo Iquilez, or some other genius.
//

const { toLibfiveValue } = require("./builder");
const { min, max } = require("./math");

const X = () => toLibfiveValue(libfive_tree_x());
const Y = () => toLibfiveValue(libfive_tree_y());
const Z = () => toLibfiveValue(libfive_tree_z());
const XYZ = () => [X(),Y(),Z()];

module.exports = {
  union: min,
  intersection: max,
  difference: (a, b) => intersection(a, neg(b)),

  X,
  Y,
  Z,
  XYZ,

  remap(shape, xyz) {
    return toLibfiveValue(
      libfive_tree_remap(
        fromLibfiveValue(shape),
        fromLibfiveValue(xyz[0]),
        fromLibfiveValue(xyz[1]),
        fromLibfiveValue(xyz[2])
      )
    );
  },

  move(shape, base){
    const [x,y,z] = XYZ();
    return shape.remap([x.sub(base[0]), y.sub(base[1]), z.sub(base[2])]);
  },

  elongate(shape, hs) {
    const xyz = XYZ();
    const q = abs(xyz).sub(hs).value;
    const q2 = [max(q[0], 0), max(q[1], 0), max(q[2], 0)];
    return shape.remap([q2[0], q2[1], q2[2]]).add(min(max(q[0],max(q[1],q[2])),0.0));
  },

  scaleX(shape, a){
    const [x,y,z] = XYZ();
    return shape.remap([x.div(a), y, z]);
  },

  scaleY(shape, a){
    const [x,y,z] = XYZ();
    return shape.remap([x, y.div(a), z]);
  },

  scaleZ(shape, a){
    const [x,y,z] = XYZ();
    return shape.remap([x, y, z.div(a)]);
  },

  rotateX(shape, angle, center){
    const [x,y,z] = XYZ();

    const a = shape.move(neg(center));
    return shape.remap([
      x,
      cos(angle).mul(y).add(sin(angle).mul(z)),
      neg(sin(angle)).mul(y).add(cos(angle).mul(z))
    ]).move(center);
  },

  rotateY(shape, angle, center){
    const [x,y,z] = XYZ();

    const a = shape.move(neg(center));
    return shape.remap([
      cos(angle).mul(x).add(sin(angle).mul(z)),
      y,
      neg(sin(angle)).mul(x).add(cos(angle).mul(z))
    ]).move(center);
  },

  rotateZ(shape, angle, center){
    const [x,y,z] = XYZ();

    const a = shape.move(neg(center));
    return shape.remap([
      cos(angle).mul(x).add(sin(angle).mul(y)),
      neg(sin(angle)).mul(x).add(cos(angle).mul(y)),
      z,
    ]).move(center);
  },

  reflectX(shape, x0){
    const [x,y,z] = XYZ();
    return shape.remap([x0.mul(2).sub(x), y, z]);
  },

  reflectY(shape, y0){
    const [x,y,z] = XYZ();
    return shape.remap([x, y0.mul(2).sub(y), z]);
  },

  reflectZ(shape, z0){
    const [x,y,z] = XYZ();
    return shape.remap([x, y, z0.mul(2).sub(z)]);
  },

  extrudeZ(shape, zmin, zmax){
    const [x, y, z] = XYZ();
    const $zmin = toLibfiveValue(zmin);
    return max(shape, max($zmin.sub(z), z.sub(zmax)));
  },

  revolveY(shape){
    const [x, y, z] = XYZ();
    const r = sqrt(x.square().add(z.square()));
    return shape.remap([r, y, z]).union(shape.remap([neg(r), y, z]));
  },

  taperXYAlongZ(shape, base, height, scale, baseScale){
    const [x,y,z] = XYZ();
    const $height = toLibfiveValue(height);
    const $scale = toLibfiveValue(scale);
    const $baseScale = toLibfiveValue(baseScale);

    const s = $height.div($scale.mul(z).add($baseScale.mul($height.sub(z))));
    return shape.move(neg(base)).remap([x.mul(s), y.mul(s), z]).move(base);
  },

  clearance(a, b, o){ return difference(a, b.offset(o)); },

  shell(shape, o){ return clearance(shape, shape, neg(abs(o))); },

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

  ellipsoid(wlh_){
    const wlh = wlh_.div(2);
    const [x,y,z] = [X(),Y(),Z()];
    const k0 = this.length([x.div(wlh[0]), y.div(wlh[1]), z.div(wlh[2])]);
    const k1 = this.length([x.div(wlh[0]**2), y.div(wlh[1]**2), z.div(wlh[2]**2)]);
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
      const cyl = cylinder(h, d1);
      //  taperXYZ(base_, height_, scale_, base_scale_)
      return cyl.taperXYZ([0,0,h/-2], h, d2/d1, 1);
    },
    elongated(h, d1, d2, stretches) {
      const cyl = cylinder(h, d1);
      return cyl
        .elongate(stretches)
        .taperXYZ([0,0,h/-2], h, d2/d1, 1);
    },
    rounded(h, d1, d2) {
      return this.capped(h, d1, d2)
        .union(sphere(d1/2).move([0, 0, h/-2]))
        .union(sphere(d2/2).move([0, 0, h/2]));
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
      return rectangle.exact(b$.slice(0, 2))
        .extrudeZ(b$[2]/-2, b$[2]/2);
    },
    roundedZ(b$, r) {
      return rectangle
        .roundedZ(b$.slice(0, 2), r)
        .extrudeZ(b$[2]/-2, b$[2]/2);
    }
  },

  textFitToArea(str_, scale, area){
    const avgGlyphSize = 0.6*scale; // taken from libfive_stdlib. In the future reimpl the glyphs.
    let strs = [];
    let str = "";
    let x = 0;
    for (let c of str_) {
       x += avgGlyphSize;
       str += c;
       if (x > area[0] && c === " ") {
         strs.push(str);
         str = "";
         x = 0;
       }
    }
    strs.push(str);

    return strs.join("\n");
  },

  print2d(str){
    return toLibfiveValue(text(str, { x: toLibfiveTree(0), y: toLibfiveTree(0) }));
  },
};
