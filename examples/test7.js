const { print2d, sphere, box, cylinder, capsule, preview } = require("../index");

function isPrime(n) {
    if (n % 2 == 0) {
	return false;
    }
    for (let i = 3; i*i <= n; i += 2) {
	if (n % i == 0) {
	    return false;
	}
    }
    return true;
}

const NUM_BALLS = 12;
const RADIUS = 1;

const model = (t) => () => {
    const t_ = t / 100;

    let balls = sphere(0.5)
    	.move([RADIUS * Math.sin(2 * t_), 0, 0]);
    
    let i = 1;
    for (let n = 3; i < NUM_BALLS; n += 2) {
    	if (isPrime(n)) {
    	    balls = balls.blend(sphere(0.5)
    				.move([RADIUS * Math.sin(n * t_), 0, 0])
    				.rotateY(i * Math.PI / NUM_BALLS),
    				0.5);
    	    i++;
    	    console.log(n);
    	}
    }

    return balls;
};

const res = 5;
const bb = [res, res, res];
const boundingBox = [bb.div(-2), bb.div(2)];

const fn = (t) => {
    return preview(model(t), boundingBox, res, res)
	.then(() => {
	    return fn(t+1);
	});
};

fn(0);
