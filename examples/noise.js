//
// Note: This sucks pretty bad as you'll see when you render.
// It sucks because I don't understand something.
// These were all taken from Inigo Iquilez.
// 
const { X, Y, Z, toLibfiveValue, sin, fract, floor, step, max, dot, length, preview, abs } = require("../index");

const resolution = 0.1;
const region = [300, 300, 300];

const $ = toLibfiveValue;

const hash = (p) => {
	const e = $([$(p).dot([127.1, 311.7]), $(p).dot([269.5, 183.3])]);
	return $(-1).add($(2).mul(fract(sin(e).mul(43758.5453123))));
};

const simplex2D = (p) => {
  const p$ = $(p); // x$ means its a list of wrapped values.

  // No $ means it's a regular JS value.
  const K1 = 0.366025404; // (sqrt(3)-1)/2;
  const K2 = 0.211324865; // (3-sqrt(3))/6;

  const i$ = floor(p$.add(p$.value[0].add(p$.value[1]).mul(K1)));
  const a$ = p$.sub(i$).add(i$.value[0].add(i$.value[1]).mul(K2));
  const $m = step(a$.value[1], a$.value[0]); // $ means a single wrapped libfive value.
  const o$ = $([$m, $(1.0).sub($m)]);
  const b$ = a$.sub(o$).add(K2);
  const c$ = a$.sub(1.0).add(2.0*K2);
  const h$_ = $(0.5).sub([dot(a$,a$), dot(b$,b$), dot(c$,c$)]);
  const h$ = max(0, max(h$_.value[0], max(h$_.value[1], h$_.value[2])));
  const n$ = h$.mul(h$).mul(h$).mul(h$).mul([dot(a$,hash(i$.add(0.0))), dot(b$,hash(i$.add(o$))), dot(c$,hash(i$.add(1.0)))]);
  return dot(n$, [70.0, 70.0, 70.0]);
}

const fbm = (noiseFn) => {
  const [$X, $Y, $Z] = [X(), Y(), Z()];

  // I think the issue is a combination of coordinate mapping and the noise function.
  // The noise function expects [0,1] coordinate system, but we're in a [-X,X] coordinate system.
  const uv$ = [$X.add(region[0]).div(region[0]/2), $Y.add(region[1]).div(region[1]/2)];

  let $f;

  $f = $(0.5000).mul(noiseFn(uv$)); 
  $f = $f.add($(0.2500).mul(noiseFn(uv$)));
  $f = $f.add($(0.1250).mul(noiseFn(uv$)));
  $f = $f.add($(0.0625).mul(noiseFn(uv$)));

  $f = $f.mul(0.5).add(0.5);

  return $Z.sub($f.mul(1));
};

const model = () => fbm(simplex2D);

preview(model, [region.mul(-1), region], resolution, resolution);
