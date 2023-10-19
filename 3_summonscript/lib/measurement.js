//
// Helpers for measurements or calculating positions.
//

const mm = 1;
exports.mm = mm;
const cm = 10;
exports.cm = cm;
const deg = (1 / 360) * (Math.PI*2);
exports.deg = deg;

const polar = (length, angle) => {
  return [Math.cos(angle)*length, Math.sin(angle)*length];
};
exports.polar = polar;

const lineEquation = (a, x, o, c) => a * (x - o) + c;
exports.lineEquation = lineEquation;

const circleEquation = (x, radius) => Math.sqrt(-(x**2) + radius**2);
exports.circleEquation = circleEquation;

const intersectionLineCircle = (angle, position, radius) => {
  const m = Math.sin(angle)/Math.cos(angle);
  const a = 1 + m**2;
  const b = 2 * m * (position[1] - (m * position[0]));
  const c = (position[1] - (m * position[0]))**2 - radius**2;
  const determinant = (b**2) - (4 * a * c);

  if (determinant < 0) { return [] };
  if (determinant == 0) { 
    const x1 = (-b + Math.sqrt(determinant)) / (2*a);
    const y1 = lineEquation(m, x1, position[0], position[1]);
    return [[x1, y1]];
  }
  if (determinant > 0) {
    const x1 = (-b + Math.sqrt(determinant)) / (2*a);
    const y1 = lineEquation(m, x1, position[0], position[1]);
    const x2 = (-b - Math.sqrt(determinant)) / (2*a);
    const y2 = lineEquation(m, x2, position[0], position[1]);
    return [[x1, y1], [x2, y2]];
  }

  return determinant;
};
exports.intersectionLineCircle = intersectionLineCircle;

const threePointArc = (p1, p2, p3) => {
  const a = (-((p2[1] - p1[1]) / (p2[0] - p1[0])))**-1;
  const o = (p1[0] + p2[0]) / 2;
  const c = (p1[1] + p2[1]) / 2;

  const b = (-((p3[1] - p2[1]) / (p3[0] - p2[0])))**-1;
  const p = (p2[0] + p3[0]) / 2;
  const d = (p2[1] + p3[1]) / 2;

  const x = ((-b * p) + d - c + (a * o)) / (a - b);
  const y = a * (x - o) + c;

  const r = Math.sqrt((x-p1[0])**2 + (y-p1[1])**2);
  return [[x, y], r];
};
exports.threePointArc = threePointArc;

