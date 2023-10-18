const { print2d, sphere, box, cylinder, capsule, preview } = require("../index");

// Due to multithreading of libfive, we must do things like this.
const model = (t) => () => {
    // const x = t/360;
    // const wave = Math.sin(x * 2*Math.PI);
    const x = t / 100;
    const wave1 = Math.sin(x * 2/3)
    const wave2 = Math.sin(x)
    const wave3 = Math.sin(x * 4/3);
    const wave4 = Math.sin(x * 5/3);

    // const text = print2d("Summon\nScript")
    // .extrudeZ(0, 0.5)
    // .move([-1.8, 0, 0.1]);

    const ball1 = sphere(0.5).move([-2 * wave2, 0, 0]);
    
    // const ball2 = sphere(0.5).move([0, 2 * wave3, 0]);
    const ball2 = cylinder(1.0, 0.3)
	  .rotateX(x)
	  .move([0, 2 * wave3, 0]);
    
    // const ball3 = sphere(0.5).move([0, -2 * wave4, 0]);
    const ball3 = capsule(0.5, 0.5)
	  .rotateY(2 * x)
	  .move([0, -2 * wave4, 0]);
    
    const cube = box.exact([0.5, 0.5, 0.5])
	  .rotateX(x)
	  .rotateY(x)
	  .rotateZ(x)
    	  .move([2 * wave1, 0, 0]);

    return ball1.blend(cube, 0.5).blend(ball2, 0.5).blend(ball3, 0.5)
	// .rotateX(-x)
	// .rotateY(-x)
	.rotateZ(-x)
};

const res = 10;
const bb = [res, res, res];
const boundingBox = [bb.div(-2), bb.div(2)];

//preview(model(60), boundingBox, res, res*2.6);

// Let's do a little animation
const fn = (t) => {
    return preview(model(t), boundingBox, res, res)
	.then(() => {
	    // if (t >= 360) return;
	    return fn(t+1);
	});
};

fn(0);
