const {
  XYZ, clamp, length, step, toLibfiveValue, sign, nothing, neg, mix, abs, min
} = require("../index");

const cross2 = (a, b) => a[0].mul(b[1]).sub(a[1].mul(b[0]));

const windingSign = (p, a, b) => {
  const e = b.sub(a);
  const w = p.sub(a);
  const cond = step(a.value[1], p.value[1])
    .add(step(p.value[1], b.value[1]))
    .add(step(e.value[1].mul(w.value[0]), e.value[0].mul(w.value[1])));

  return toLibfiveValue(1).sub(neg(cond).mul(2).mod(3).mul(cond.mod(3)).sub(1).mod(3));
};

const sketch = ({ startPoint }) => {
  const [X, Y, Z] = XYZ();
  return {
    currentPoint: startPoint,
    xy: toLibfiveValue([X.add(0.5),Y.add(0.75)]),
    value: toLibfiveValue(1e10), // Something to do with accuracy?
    winding: toLibfiveValue(1.0),
    line(b_) {
      const a = toLibfiveValue(this.currentPoint);
      const b = toLibfiveValue(b_.add(this.currentPoint));

      const pa = this.xy.sub(a);
      const ba = b.sub(a);
      const h = clamp(pa.dot(ba).div(ba.dot(ba)), 0.0, 1.0);
      const result = length(pa.sub(ba.mul(h)));

      this.currentPoint = b_.add(this.currentPoint);
      this.value = this.value.union(result);
      this.winding = this.winding.mul(windingSign(this.xy, a, b));
      return this;
    },
    arc(sc_, ra_) {
      //float sdArc( in vec2 p, in vec2 sc, in float ra, float rb )
      const sc = toLibfiveValue(sc_);
      const ra = toLibfiveValue(ra_);

      const px = abs(this.xy.value[0]);
      const cond = step(sc.value[0].mul(this.xy.value[1]), sc.value[1].mul(p.x));

      const result = cond.mul(length(p.sub(sc.mul(ra)))) // if true
        .add(toLibfiveValue(1).sub(cond).mul(abs(length(p).sub(ra)))); // else

      this.value = this.value.union(result);
      return this;
    },
    done() {
      return this.value.mul(this.winding);
    },
  };
};

const polar = (length, angle) => {
  return [Math.cos(angle)*length, Math.sin(angle)*length];
};

module.exports = {
  sketch,
  polar,
};
