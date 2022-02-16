
const React = require('react');
const $ = require('jquery');

/**
 * This library was adopted from https://jsfiddle.net/dtrooper/AceJJ/
 */

let particles = [];
let rockets = [];
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;

function Particle(pos) {
    this.pos = {
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0,
    };
    this.vel = {
        x: 0,
        y: 0,
    };
    this.shrink = 0.97;
    this.size = 2;

    this.resistance = 1;
    this.gravity = 0;

    this.flick = false;

    this.alpha = 1;
    this.fade = 0;
    this.color = 0;
}

Particle.prototype.update = function () {
    // apply resistance
    this.vel.x *= this.resistance;
    this.vel.y *= this.resistance;

    // gravity down
    this.vel.y += this.gravity;

    // update position based on speed
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    // shrink
    this.size *= this.shrink;

    // fade out
    this.alpha -= this.fade;
};

Particle.prototype.render = function (c) {
    if (!this.exists()) {
        return;
    }

    c.save();

    c.globalCompositeOperation = 'darker';

    const x = this.pos.x;
    const y = this.pos.y;
    const r = this.size / 2;

    const gradient = c.createRadialGradient(x, y, 0.1, x, y, r);
    gradient.addColorStop(0.1, `rgba(0,0,0,${this.alpha})`);
    gradient.addColorStop(0.8, `hsla(${this.color}, 100%, 50%, ${this.alpha})`);
    gradient.addColorStop(1, `hsla(${this.color}, 100%, 50%, 0.1)`);

    c.fillStyle = gradient;

    c.beginPath();
    c.arc(this.pos.x, this.pos.y, this.flick ? Math.random() * this.size : this.size, 0, Math.PI * 2, true);
    c.closePath();
    c.fill();

    c.restore();
};

Particle.prototype.exists = function () {
    return this.alpha >= 0.1 && this.size >= 1;
};

function Rocket(x) {
    Particle.apply(this, [{
        x,
        y: SCREEN_HEIGHT,
    }]);

    this.explosionColor = 0;
}

Rocket.prototype = new Particle();
Rocket.prototype.constructor = Rocket;

Rocket.prototype.explode = function () {
    const count = Math.random() * 10 + 80;

    for (let i = 0; i < count; i++) {
        const particle = new Particle(this.pos);
        const angle = Math.random() * Math.PI * 2;

        // emulate 3D effect by using cosine and put more particles in the middle
        const speed = Math.cos(Math.random() * Math.PI / 2) * 15;

        particle.vel.x = Math.cos(angle) * speed;
        particle.vel.y = Math.sin(angle) * speed;

        particle.size = 10;

        particle.gravity = 0.2;
        particle.resistance = 0.92;
        particle.shrink = Math.random() * 0.05 + 0.93;

        particle.flick = true;
        particle.color = this.explosionColor;

        particles.push(particle);
    }
};

Rocket.prototype.render = function (c) {
    if (!this.exists()) {
        return;
    }

    c.save();

    c.globalCompositeOperation = 'darker';

    const x = this.pos.x;
    const y = this.pos.y;
    const r = this.size / 2;

    const gradient = c.createRadialGradient(x, y, 0.1, x, y, r);
    gradient.addColorStop(0.1, `rgba(0, 0, 0 ,${this.alpha})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${this.alpha})`);

    c.fillStyle = gradient;

    c.beginPath();
    c.arc(this.pos.x, this.pos.y, this.flick ? Math.random() * this.size / 2 + this.size / 2 : this.size, 0, Math.PI * 2, true);
    c.closePath();
    c.fill();

    c.restore();
};


module.exports = React.createClass({
    componentWillMount() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.MAX_PARTICLES = 400;
        this.MAX_ROCKETS = 10;
        this.colorCode = 0;
        this.mousePos = {
            x: 400,
            y: 300,
        };
        particles = [];
        rockets = [];
    },

    componentDidMount() {
        $(this.canvas).css({
            position: 'fixed',
        });
        $('body').prepend(this.canvas);
        this.canvas.width = SCREEN_WIDTH;
        this.canvas.height = SCREEN_HEIGHT;

        // update mouse position
        $(document).mousemove((e) => {
            e.preventDefault();
            this.mousePos = {
                x: e.clientX,
                y: e.clientY,
            };
        });

        let rocketsFired = 0;

        this.launchInterval = setInterval(() => {
            if (rockets.length < 10 && rocketsFired < this.MAX_ROCKETS) {
                const rocket = new Rocket(this.mousePos.x);
                rocket.explosionColor = Math.floor(Math.random() * 360 / 10) * 10;
                rocket.vel.y = Math.random() * -3 - 4;
                rocket.vel.x = Math.random() * 6 - 3;
                rocket.size = 8;
                rocket.shrink = 0.999;
                rocket.gravity = 0.01;
                rockets.push(rocket);
                rocketsFired++;
            }
        }, 100);

        this.fireInterval = setInterval(this.fire, 1000 / 50);
    },

    componentWillUnmount() {
        clearInterval(this.launchInterval);
        clearInterval(this.fireInterval);
        $(this.canvas).remove();
    },

    fire() {
    // update screen size
        if (SCREEN_WIDTH !== window.innerWidth) {
            this.canvas.width = SCREEN_WIDTH = window.innerWidth;
        }
        if (SCREEN_HEIGHT !== window.innerHeight) {
            this.canvas.height = SCREEN_HEIGHT = window.innerHeight;
        }

        // clear canvas
        this.context.fillStyle = 'rgba(255, 255, 255, 1)';
        this.context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        const existingRockets = [];

        for (let i = 0; i < rockets.length; i++) {
            // update and render
            rockets[i].update();
            rockets[i].render(this.context);

            // calculate distance with Pythagoras
            const distance = Math.sqrt(Math.pow(this.mousePos.x - rockets[i].pos.x, 2) + Math.pow(this.mousePos.y - rockets[i].pos.y, 2));

            // random chance of 1% if rockets is above the middle
            const randomChance = rockets[i].pos.y < (SCREEN_HEIGHT * 2 / 3) ? (Math.random() * 100 <= 1) : false;

            /* Explosion rules
                   - 80% of screen
                  - going down
                  - close to the mouse
                  - 1% chance of random explosion
                */
            if (rockets[i].pos.y < SCREEN_HEIGHT / 5 || rockets[i].vel.y >= 0 || distance < 50 || randomChance) {
                rockets[i].explode();
            } else {
                existingRockets.push(rockets[i]);
            }
        }

        rockets = existingRockets;

        const existingParticles = [];

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();

            // render and save particles that can be rendered
            if (particles[i].exists()) {
                particles[i].render(this.context);
                existingParticles.push(particles[i]);
            }
        }

        // update array with existing particles - old particles should be garbage collected
        particles = existingParticles;

        while (particles.length > this.MAX_PARTICLES) {
            particles.shift();
        }
    },

    render() {
        return null;
    },
});
