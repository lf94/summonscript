//
// Helpers for measurements or calculating positions.
//

exports.mm = 1;
exports.cm = 10;
exports.deg = (1 / 360) * (Math.PI*2);

const polar = (length, angle) => {
  return [Math.cos(angle)*length, Math.sin(angle)*length];
};
exports.polar = polar;
