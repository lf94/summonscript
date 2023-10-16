const { Value, min } = require("./3_summonscript/index");
const { abs } = require("./3_summonscript/lib/math");

console.log(new Value(1).union(8).add(4).sub(3).neg().blendSmooth(new Value(3), 1).reify());
