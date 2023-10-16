const _ = {
  union: min,
  intersection: max,
  difference(a, b) { return _.intersection(a, neg(b)); },

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

  clearance(a, b, o){ return _.difference(a, b.offset(o)); },

  shell(shape, o){ return _.clearance(shape, shape, neg(abs(o))); },
};

module.exports = _;
