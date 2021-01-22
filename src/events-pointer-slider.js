const canvas = document.querySelector('#gl-canvas');
const cursor = document.querySelector('#iteration-cursor');
const slider = document.querySelector('#iteration-slider');


export function slide(event) {

    const shiftX = event.clientX - cursor.getBoundingClientRect().left;
    const sliderRect = slider.getBoundingClientRect();

    const data = {
        shiftX: shiftX,
        sliderRect: sliderRect,
    };

    cursor.setPointerCapture(event.pointerId);

    data.pointerMove = pointerMove.bind(data);
    data.pointerUp = pointerUp.bind(data);

    canvas.setUniform('uAntialiasing', false, '1i');

    cursor.addEventListener('pointermove', data.pointerMove);
    document.addEventListener('pointerup', data.pointerUp);
    document.addEventListener('pointercancel', data.pointerUp);
}


function pointerMove(event) {
    let left = event.clientX - this.shiftX - this.sliderRect.left;

    if (left < 0)
        left = 0;
    else if (left > this.sliderRect.width)
        left = this.sliderRect.width;

    const iterationFactor = left / this.sliderRect.width * 256.0 - 64.0;
    canvas.setUniform('uIterationFactor', iterationFactor, '1f');

    cursor.style.left = `${left}px`;
}

function pointerUp(event) {
    cursor.removeEventListener('pointermove', this.pointerMove);
    document.removeEventListener('pointerup', this.pointerUp);
    document.removeEventListener('pointercancel', this.pointerUp);

    canvas.setUniform('uAntialiasing', true, '1i');
    canvas.setState('iterationFactor');

    cursor.releasePointerCapture(event.pointerId);
}
