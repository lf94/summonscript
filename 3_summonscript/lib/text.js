// Unfortunately this one is complex.
// We can eventually provide our own implementation.
const { text } = require("../koffi/libfive-stdlib");
const { toLibfiveTreeConst } = require("../libfive-helper");
const { Value } = require("../value");

const textFitToArea = (str_, scale, area) => {
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
};
exports.textFitToArea = textFitToArea;

const print2d = (str) => {
  return new Value(text(str, { x: toLibfiveTreeConst(0), y: toLibfiveTreeConst(0) }));
};
exports.print2d = print2d;
