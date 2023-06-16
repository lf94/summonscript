const { cone,cylinder,half_space, nothing,mm,deg,saveAsSTL } = require("../index");

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
        return [0, 0, d.height/2 - 1*mm];
      },
    };
  },
  peg() {
    return {
      height: (d.dia / 2) - d.shell,
      d1: (d.dia - d.shell*2) - 2*mm,
      d2: ((d.dia - d.shell*2) - 2*mm) / 2,
      xyz() {
        return [this.height/-2, 0, d.height/2 - this.height - 6.0*mm];
      }
    };
  },
};

const base = cylinder(d.height-d.round*2, d.dia-d.round*2).offset(d.round);
const neck = cone(d.neck().height, 16*mm, 4*mm);
const peg =  cone(d.peg().height, d.peg().d1, d.peg().d2).rotateY(-90*deg);
const result = base
  .union(neck.move(d.neck().xyz()), 1*mm)
  .union(neck.rotateY(180*deg).move(d.neck().xyz().mul(-1)), 1*mm)
  .shell(d.shell)
  .difference(cylinder((d.height+d.neck().height*2)*mm, d.wireDiameter))
  .difference(half_space([-1,0,0], [0,0,0]))
  .union(peg.move(d.peg().xyz()), 1*mm);

const res = 1.0;
const region = [50,50,50];
saveAsSTL(result,[region.mul(-1),region],10.0,"wire-enclosure.stl");
