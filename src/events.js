import {pan as keyboardPan, zoom as keyboardZoom} from './events-keyboard.js';
import {panZoom as pointerPanZoom} from './events-pointer.js';
import {rotate as rotatePowerKnob} from './events-pointer-knob.js';
import {slide as iterationSlide} from './events-pointer-slider.js';

const canvas = document.querySelector('#gl-canvas');
const homeButton = document.querySelector('#home-button');
const powerKnob = document.querySelector('#power-knob');
const powerPlus = document.querySelector('#power-plus');
const powerMinus = document.querySelector('#power-minus');
const iterationCursor = document.querySelector('#iteration-cursor');
const iterationSlider = document.querySelector('#iteration-slider');


function resizeVh() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function resize() {
    resizeVh();
    canvas.resize();
}

resizeVh();
window.addEventListener('resize', resize);


window.addEventListener('popstate', () => canvas.getState());


document.addEventListener('keydown', event => {
    if ([8, 32, 37, 38, 39, 40].includes(event.keyCode)) {
        canvas.setUniform('uAntialiasing', false, '1i');
        if (event.keyCode == 37) {
            keyboardPan({0: -0.05});
        } else if (event.keyCode == 39) {
            keyboardPan({0: 0.05});
        } else if (event.keyCode == 38) {
            keyboardPan({1: 0.05});
        } else if (event.keyCode == 40) {
            keyboardPan({1: -0.05});
        } else if (event.keyCode == 32) {
            keyboardZoom(0.95);
        } else if (event.keyCode == 8) {
            keyboardZoom(1.0/0.95);
        }
    };
});


document.addEventListener('keyup', event => {
    if ([8, 32, 37, 38, 39, 40].includes(event.keyCode)) {
        canvas.setUniform('uAntialiasing', true, '1i');
        if ([37, 38, 39, 40].includes(event.keyCode))
            canvas.setState('shift');
        else if ([8, 32].includes(event.keyCode))
            canvas.setState('scale');
    }
});


canvas.addEventListener('pointerdown', event => {
    pointerPanZoom(event);
});


homeButton.addEventListener('click', event => {
    canvas.getState(true);
    canvas.setState('scale', 'shift', 'power', 'iterationFactor');
    iterationCursor.style = {};
    powerKnob.style = {};
});


iterationSlider.addEventListener('click', event => {
    const rect = iterationSlider.getBoundingClientRect();
    const left = event.clientX - rect.left;

    const iterationFactor = left / rect.width * 256.0 - 64.0;
    canvas.setUniform('uIterationFactor', iterationFactor, '1f');

    iterationCursor.style.left = `${left}px`;
});

iterationCursor.addEventListener('pointerdown', event => {
    iterationSlide(event);
});


powerKnob.addEventListener('pointerdown', event => {
    rotatePowerKnob(event);
});


powerPlus.addEventListener('click', event => {
    let power = canvas.getUniform('uPower');
    power = Math.floor(power) + 1.0;
    canvas.setUniform('uPower', power, '1f');
    canvas.setState('power');
});


powerMinus.addEventListener('click', event => {
    let power = canvas.getUniform('uPower');
    power = Math.ceil(power) - 1.0;
    canvas.setUniform('uPower', power, '1f');
    canvas.setState('power');
});
