// A playing card, with the dimensions of Magic the Gathering cards.
// Print with a 0.1mm height!

const { box, mm, deg, print2d, textFitToArea, Viewer } = require("../3_summonscript");

const layout = {
  card: { w: 63.5*mm, l: 88.9*mm, h: 0.4*mm, r: 3.0*mm },
  text: { h: 0.1*mm, z() { return layout.card.h - this.h; } },
  title() {
    return {
      position: [ this.card.w/-2 + 2*mm,  this.card.l/2 - 4*mm - 2*mm, this.text.z(), ]
    }
  },
  meta() {
    return {
      position: [ this.card.w/-2 + 2*mm,  this.title().position[1]-1.1*4*2-2.0, this.text.z() ]
    }
  },
  desc() {
    return {
      position: [ this.card.w/-2 + 2*mm, 0, this.text.z() ]
    }
  }
};

const base2d = box.roundedZ([layout.card.w, layout.card.l], layout.card.r);
const base3d = base2d.extrudeZ(0, layout.card.h);

const title2d = print2d("The Professor\nKeeper of Knowledge");
const title3d = title2d.scaleX(4.0).scaleY(4.0).extrudeZ(0, layout.text.h);

const meta2d = print2d("Identity: Natural\n\nDeck size: 45 - Influence: 1 - Link: 0");
const meta3d = meta2d.scaleX(2.5).scaleY(2.5).extrudeZ(0, layout.text.h);

const desc2d = print2d(textFitToArea(
  "The first copy of each program in this deck does not count against your influence limit.",
  4.0,
  [layout.card.w-2.0, layout.card.l]
));
const desc3d = desc2d.scaleX(3.0).scaleY(3.0).extrudeZ(0, layout.text.h);

const text3d = title3d.move(layout.title().position)
  .union(meta3d.move(layout.meta().position))
  .union(desc3d.move(layout.desc().position));

const card3d = base3d.difference(text3d);
const result = text3d //.rotateY(180*deg);

const region = [100,100,100];
Viewer.upload(result, [region.mul(-1), region], 2, 4);
