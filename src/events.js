import {pan as keyboardPan, zoom as keyboardZoom} from './events-keyboard.js';
import {panZoom as pointerPanZoom} from './events-pointer.js';

const canvas = document.querySelector('#gl-canvas');
const homeButton = document.querySelector('#home-button');


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
    canvas.setState('scale', 'shift');
})
