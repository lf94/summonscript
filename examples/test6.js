const { print2d, sphere, box, cylinder, capsule, preview } = require("../index");

function pauseAtIntervals(f, p) {
    return (t) => {
	return f(Math.floor((Math.floor(t / p) + 1) / 2) * p +
		 (t % p) * (Math.floor(t / p) % 2 == 0 ? 1 : 0));
    }
}

const model = (t) => () => {
    const t_ = t / 100;

    const ball = sphere(0.5)
	  .move([pauseAtIntervals((x) => { return -2 * Math.sin(x / 100); }, 20)(t), 0, 0]);
    
    const cyl = cylinder(1.0, 0.3)
	  .rotateX(t_)
    	  .move([0, pauseAtIntervals((x) => { return 2 * Math.sin(x / 100 * 5/3); }, 30)(t), 0]);
    
    const cap = capsule(0.5, 0.5)
	  .rotateY(2 * t_)
          .move([0, pauseAtIntervals((x) => { return -2 * Math.sin(x / 100 * 7/3); }, 50)(t), 0]);
    
    const cube = box.exact([0.5, 0.5, 0.5])
	  .rotateX(t_)
	  .rotateY(t_)
	  .rotateZ(t_)
          .move([0, pauseAtIntervals((x) => { return -2 * Math.sin(x / 100 * 2/3); }, 70)(t), 0]);

    return ball.blend(cube, 0.5).blend(cyl, 0.5).blend(cap, 0.5).rotateZ(-t_)
};

const res = 10;
const bb = [res, res, res];
const boundingBox = [bb.div(-2), bb.div(2)];

const fn = (t) => {
    return preview(model(t), boundingBox, res, res)
	.then(() => {
	    return fn(t+1);
	});
};

fn(0);
