// Welcome fellow wizard or witch, to the world of code CAD. This magic will
// bestow upon you the ability to manifest models with language!

// Let's cut to the chase. You came here to learn something cool, so let's go.

// This is a "cumulative learning" tutorial, so we're going to import the pieces
// that we need at the moment we need them.

// You'll either always want Viewer, or saveAs. The names are self-descriptive.
// When using from npm, you'll write require("summonscript")
const { Viewer, saveAs } = require("../3_summonscript");

// Before you continue, *start the viewer*, otherwise you won't be able to see
// anything!

// Next let's make some simple shapes. We can start in 2D, or 3D.
// Because we're taking a cumulative learning approach, we'll start with 2D.
const { circle, rectangle } = require("../3_summonscript");

// Here we make a circle of diameter 1; a rectangle of width 6, length 2;
// and finally we "union them", which simply combines them together!
const stuff = circle(1).union(rectangle([6, 2]));

// (Note: things like sketching are possible too, but they're not well supported
// in SummonScript currently.)

// Simple so far right? Already you see the general style of how to compose
// SummonScripts. Let's move the rectangle a little to the right (x-axis) so
// it's not completely hiding the circle.
const stuff2 = circle(1).union(rectangle[6, 2]).move([3, 0, 0]));

// Let's bring the 2D object into 3D space.
// The parameters may seem odd, but it's the start and end of how to "stretch
// out" the 2D shape. Here we essentially stretch it out 1 unit up the z-axis
// (which is upward).
const stuff3d = stuff2.extrudeZ(0, 1);

// Uncomment and subsequent comments like this if you want to see the result.
// We pass the model we've described, the bounding box, and a stand and end
// resolution for progressive rendering.
// The bounding box is necessary because SummonScripts can generate models which
// are infinitely large, so we must specify a cut-off.
// The start/end resolution is necessary to know the amount of detail we want
// to see, since you can write fractal SummonScripts with infinite detail.
// Progressive rendering keeps things responsive while continuing to render
// more detail as you think and work.
// Viewer.upload(stuff3d, [[-3,-3,-3],[3,3,3]], 1, 4);

// Or we can save it to the common 3D STL file format:
// saveAs.stl(stuff3d, [[-3, -3, -3],[3,3,3]], 4);

// There are many other transforms other than extrudeZ. Check out lib/transform.js
// or value.js for more!
const { box, repeatRadial } = require("../3_summonscript");

// This will repeat a twisted box 9 times across a circle of radius 3.
// It's radius 3 because we move the box to the right 3 units, and repeatRadial
// copies it in a circular path.
const thing = repeatRadial(box.twist(1).move([3, 0, 0]), 9);
// Viewer.upload(thing, [[-6,-6,-6],[3,3,3]], 1, 4)

// And honestly, that's pretty much it! From here, we can really go HAM and
// create a small scene with a moving sphere, cube and text.

// Scroll to the bottom and uncomment fn(0);

const model = (t) => {
  const wave = Math.sin(t/360 * 2*Math.PI);

  const text = print2d("Summon\nScript")
  .extrudeZ(0, 0.5)
  .move([-1.8, 0, 0.1]);

  const ballPosition = [-1*wave, 1, 1];
  const ball = sphere(0.5).move(ballPosition);
  const cube = box.exact([0.5, 0.5, 0.5])
    .move(ballPosition.add([0.5, 0, 1*wave]));

  return text.union(ball).unionBlend(cube, 0.5)
};

const res = 5;
const bb = [res, res, res];
const boundingBox = [bb.div(-2), bb.div(2)];

// Let's do a little animation
const fn = (t) => {
  return Viewer.upload(model(t), boundingBox, res, res)
  .then(() => {
    if (t >= 360) return;
    return fn(t+2);
  });
};

// Hey! Over here!
// fn(0);

// At this point, explore the project and find what functions may trigger
// some ideas. Put them together. Play. Ask questions. Join us.
// irc.libera.chat #summonscript 
// We look forward to your spells :)
