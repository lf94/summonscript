const {
  XYZ, clamp, length, step, toLibfiveValue, sign, nothing, neg, mix, abs, min
} = require("../index");

const cross2 = (a, b) => a[0].mul(b[1]).sub(a[1].mul(b[0]));

// different from regular intersection.
const intersection = (d1, d2) => {
  const dmin = min(abs(d1), abs(d2));
  return dmin.mul(sign(d1).mul(sign(d2)));
};

const sketch = ({ startPoint }) => {
  const [X, Y, Z] = XYZ();
  return {
    currentPoint: startPoint,
    xy: toLibfiveValue([X,Y]),
    value: toLibfiveValue(1e6), // Something to do with accuracy?
    line(B_) {
      const A = toLibfiveValue(this.currentPoint);
      const B = toLibfiveValue(B_.add(this.currentPoint));

      const pa = this.xy.sub(A);
      const ba = B.sub(A);

      const h = clamp(pa.dot(ba).div(ba.dot(ba)), 0.0, 1.0 );
      const d = length(pa.sub(ba.mul(h)));

    	const sa = cross2(A.value, this.xy.value);
    	const sc = cross2(ba.value, pa.value);
    	const s0 = cross2(neg(B).value, this.xy.sub(B).value);

    	const sac0lt = step(0.0, (step(sa, 0.0).add(step(sc, 0.0)).add(step(s0, 0.0))).sub(3));
    	const sac0gt = step(0.0, (step(0.0, sa).add(step(0.0, sc)).add(step(0.0, s0))).sub(3));

      const ts =  toLibfiveValue(1.0).sub(toLibfiveValue(2.0).mul(sac0lt));
      const ts2 =  toLibfiveValue(1.0).sub(toLibfiveValue(2.0).mul(sac0gt));

      const result = d.mul(sign(mix(ts2, ts, step(sc, 0.0))))

      this.currentPoint = B_.add(this.currentPoint);
      this.value = intersection(this.value, result);
      return this;
    },
    done() {
      return this.value;
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
