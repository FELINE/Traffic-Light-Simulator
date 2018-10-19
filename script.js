/**
 * Traffic Light Simulation demo
 * Demonstrates following patterns:
 *    Simple Object Constructor Function : Point2D
 *    Complex Object Constructor Function: Light
 *    Constant Object Literal : LIGHT_BOX
 *		Object Literal Map	    :  LIGHT_POS,  TRAFFIC_STATES
 *    Complex Object Literal  : TrafficLight, TimerControl
 *    Cycle       :  TRAFFIC_STATES.nextState()
 *    Array Map   :  TRAFFIC_STATES.LIGHT_TIMES
 *    Basic Event handling    : changeLight, controlAnimation
 *    Animation timer control : TimerControl
 **/

var theCanvas = document.querySelector("#theCanvas");
var ctx = theCanvas.getContext("2d");

// A 2D Coordinate object representing a point on a 2D plane (e.g. the canvas context)
var Coord2D = function (x, y) {
    return {
        x: x,
        y: y,
    };
};

theCanvas.center = new Coord2D(theCanvas.width / 2, theCanvas.height / 2);

// Traffic Light MODEL

// The radius of lights drawn by this app and the fill color for lights that are 'off'
var LIGHT_SIZE = 20;
var LIGHT_OFF = 'white';

/**
 * Object Constructor for ONE LIGHT -- a colored circle that can be turned on or off
 * A Light object that knows how to switch itself on and off, 
 * and how to draw itself on a canvas 2d context
 */
var Light = function (centerCoord, color) {
    // Model State data (used to keep track of the state of this light)
    this.isOn = false;

    // Model algorithms.
    this.switch = function (on) {
        this.isOn = on;
    }
    this.switchOn = function () {
            this.switch(true);
        }, // delegation
        this.switchOff = function () {
            this.switch(false);
        }, // delegation
        this.toggle = function () {
            this.switch(!this.isOn);
        }

    // Visual state data (does not change after construction)
    this.center = centerCoord;
    this.radius = LIGHT_SIZE;
    this.color = color;

    this.draw = function (ctx) {
        ctx.beginPath();
        if (this.isOn) {
            ctx.fillStyle = this.color;
        } else {
            ctx.fillStyle = LIGHT_OFF;
        }
        ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
    }
};

// Visual Rectangle to reprenent the outline of the traffic light on Canvas
var LIGHT_BOX = {
    // top-left of the rectangle
    x: theCanvas.center.x - LIGHT_SIZE * 1.5,
    y: theCanvas.center.y - LIGHT_SIZE * 4,
    // width and height of the rectangle
    width: LIGHT_SIZE * 3, // 2*radius + 1/2 radius spacing on each side
    height: LIGHT_SIZE * 8, // 6*radius + 4*1/2 radius vertical spacing

    center: theCanvas.center,

    bottom: function () { // y-ordinate of bottom of light box
        return this.y + this.height;
    },
    right: function () { // x-ordinate of right-hand edge of light box
        this.x + this.width;
    },

    draw: function (ctx) {
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    },
};

// Center Coordinate for each light within the LIGHT_BOX.
var LIGHT_POS = {
    TOP: new Coord2D(LIGHT_BOX.center.x, LIGHT_BOX.y + LIGHT_SIZE * 1.5),
    MIDDLE: new Coord2D(LIGHT_BOX.center.x, LIGHT_BOX.center.y),
    BOTTOM: new Coord2D(LIGHT_BOX.center.x, LIGHT_BOX.bottom() - LIGHT_SIZE * 1.5),
};


/**
 * Model of the STATE transitions made by the Traffic Light
 *   Traffic Light moves between these states in a cycle
 *   Traffic Light stays in each state for a certain duration.
 */
var TRAFFIC_STATES = {
    STOP: 0,
    GO: 1,
    YIELD: 2,
    CAUTION: 3, // special state for flashing yellow.

    nextState: function (previousState) {
        // cycle through states (map previous State onto next State)
        if (previousState == this.CAUTION) {
            return previousState;
        } else {
            return (previousState + 1) % 3;
        }
    },

    LIGHT_TIMES: [2, 3, 0.5, 1], // Map state onto time-in-seconds to stay in state

    secondsToStayInState: function (state) {
        // state must be one of the TRAFFIC_STATES defined above.
        return this.LIGHT_TIMES[state];
    }
};


/**
 * The Traffic Light object 
 * Defines both the state of a traffic light (the models) and
 *    its visual represnetation on the Canvas
 */
var TrafficLight = {
    lights: {
        red: new Light(LIGHT_POS.TOP, 'red'),
        yellow: new Light(LIGHT_POS.MIDDLE, 'yellow'),
        green: new Light(LIGHT_POS.BOTTOM, 'green'),
    },

    state: TRAFFIC_STATES.STOP,

    init: function () {
        // call this function to initialize the TrafficLight object to a valid state
        this.state = TRAFFIC_STATES.STOP;
        this.lights.red.switchOn();
        this.lights.yellow.switchOff();
        this.lights.green.switchOff();
    },

    change: function () {
        this.state = TRAFFIC_STATES.nextState(this.state);

        // Being very 'clever' here -- can you 'think Boolean'?
        var redLightOn = (this.state == TRAFFIC_STATES.STOP);
        var yellowLightOn = (this.state == TRAFFIC_STATES.YIELD);
        var greenLightOn = (this.state === TRAFFIC_STATES.GO);

        this.lights.red.switch(redLightOn);
        if (this.state == TRAFFIC_STATES.CAUTION) {
            this.lights.yellow.toggle();
        } else {
            this.lights.yellow.switch(yellowLightOn);
        }
        this.lights.green.switch(greenLightOn);
    },

    toggleCaution: function () {
        // toggle the TrafficLight between normal mode and "caution' mode
        if (this.state !== TRAFFIC_STATES.CAUTION) {
            this.state = TRAFFIC_STATES.CAUTION;
        } else {
            this.state = TRAFFIC_STATES.YIELD;
        }
    },

    // I decided that the timing for state transitions belong at this
    // level of organization, rather than down with the individual lights.
    timeTillChange: function () {
        return TRAFFIC_STATES.secondsToStayInState(this.state);
    },


    // Visual Elements of the Traffic Light also include the lights themselves.	
    box: LIGHT_BOX,

    draw: function (ctx) {
        // classic 'delegation' pattern.  TrafficLight delegates drawing work to other objects.
        this.box.draw(ctx);
        for (light in this.lights) {
            this.lights[light].draw(ctx);
        }
    },

};

// Initialize the TrafficLight when the page loads.
TrafficLight.init();
TrafficLight.draw(ctx);

// SIMULATION:
// General function to "step" the simultaion one step forward.
function step() {
    TrafficLight.change();
    TrafficLight.draw(ctx);
}
// Direct control - the "Change" button allows you to step the simulation
var changeButton = document.getElementById('change');
changeButton.onclick = changeLight;

function changeLight(event) {
    step();
}


// Reusable Animation Timer Object Constructor
// This timer is controlled by a DOM element (usually a button)
// Pass in the DOM element used to start/stop the timer, and
// a function to be called when the timer fires.
// For a repeating animations, the callback function should re-start the timer.
function TimerControl(button, callback) {
    // the DOM button used to control the timer
    this.button = button;

    // the function to call when this timer fires
    this.callback = callback;

    // Button commands and labels to show state of timer
    this.COMMANDS = {
        START: 'start',
        STOP: 'stop',
    };
    this.LABELS = {
        START: 'Start Simulation',
        STOP: 'Stop  Simulation',
    };

    // state of the timer itself -- false when timer is not running.
    this.timer = false;

    // start the timer to call the 'callback' function after n seconds
    this.start = function (seconds) {
        this.timer = setTimeout(this.callback, seconds * 1000); // convert time to milliseconds
        this.button.value = this.COMMANDS.STOP;
        this.button.innerHTML = this.LABELS.STOP;
    };

    // Stop the timer
    this.stop = function () {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = false;
        this.button.value = this.COMMANDS.START;
        this.button.innerHTML = this.LABELS.START;
    };

    // Putting it all together so the button controls the timer.
    var self = this; // JS hack to work around dynamic scoping of this.
    // event hanlder for the button used to control this timer
    this.controlTimer = function (event) {
        var action = event.target.value;
        if (action == self.COMMANDS.START) {
            // start the animation in 1/2 second.
            self.start(0.5);
        } else { // STOP
            self.stop();
        }
    };
    // set up the button so clicks will control this timer
    this.button.onclick = this.controlTimer;
}

// Animation control:
var animationButton = document.getElementById('animate');
var timerControl = new TimerControl(animationButton, animateTrafficLight)

function animateTrafficLight() {
    step();
    // At the end of each animation step, start a timer for the next animation.
    timerControl.start(TrafficLight.timeTillChange());
}

// Caution Mode.
var cautionButton = document.getElementById('caution');
cautionButton.onclick = cautionLight;

function cautionLight(event) {
    TrafficLight.toggleCaution();
}