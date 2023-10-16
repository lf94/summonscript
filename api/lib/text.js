// Unfortunately this one is complex.
// We can eventually provide our own implementation.
const { text } = require("./libfive-stdlib");

const { toLibfiveValue } = require("../index");

module.exports = {
  textFitToArea(str_, scale, area) {
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

  print2d(str) {
    return toLibfiveValue(text(str, { x: toLibfiveTree(0), y: toLibfiveTree(0) }));
  },
};
