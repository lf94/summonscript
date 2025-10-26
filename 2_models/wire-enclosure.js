const { cone, capsule, cylinder, halfSpace, nothing, mm, deg, Viewer } = require("../3_summonscript");

const d = {
  round: 5.0*mm,
  height: 40*mm,
  dia: 9.85*mm,
  shell: 1*mm,
  wireDiameter: 3*mm,
  neck() {
    return {
      height: 6*mm,
      xyz() { 
        return [0, 0, (d.height/2)];
      },
    };
  },
  peg() {
    return {
      height: (d.dia / 2) - d.shell,
      d1: (d.dia - d.shell*2) - 3*mm,
      d2: ((d.dia - d.shell*2) - 3*mm) / 2,
      xyz() {
        return [this.height/-2, 0, d.height/2 - this.height - 6.0*mm];
      }
    };
  },
};

const model = () => {
  const base = capsule(d.height - d.dia, d.dia).elongate([0, 0.5, 0]);
  const neck = cone.capped(d.neck().height, 6*mm, 4*mm);
  const peg = cone.elongate(d.peg().height, d.peg().d1, d.peg().d2, [2, 0, 0]).rotateY(-90*deg);
  return base
    .union(neck.move(d.neck().xyz()), 1*mm)
    .union(neck.rotateY(180*deg).move(d.neck().xyz().mul(-1)), 1*mm)
    .shell(d.shell)
    .difference(cylinder((d.height+d.neck().height*2)*mm, d.wireDiameter))
    .difference(halfSpace([-1,0,0], [0,0,0]))
    .union(peg.move(d.peg().xyz()), 1*mm);
};

const region = [50,50,50];
Viewer.upload(model(), [region.mul(-1),region], 0.5, 2);
