const canvas = document.querySelector('#gl-canvas');
const knob = document.querySelector('#power-knob');

knob.currentAngle = knob.currentAngle || 0.0;


export function rotate(event) {
    const rect = knob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2.0;
    const centerY = rect.top + rect.height / 2.0;

    const data = {
        centerX: centerX,
        centerY: centerY,
        initialAngle: null,
        previousAngle: null,
        jumps: 0,
        scale: canvas.getUniform('uScale'),
        initialPower: canvas.getUniform('uPower')
    };

    data.computeAngle = computeAngle;
    data.initialAngle = data.computeAngle(event);

    data.pointerMove = pointerMove.bind(data);
    data.pointerUp = pointerUp.bind(data);

    knob.setPointerCapture(event.pointerId);
    canvas.setUniform('uAntialiasing', false, '1i');

    knob.addEventListener('pointermove', data.pointerMove);
    document.addEventListener('pointerup', data.pointerUp);
    document.addEventListener('pointercancel', data.pointerUp);
}

function pointerMove(event) {
    const angle = this.computeAngle(event);
    const displayAngle = knob.currentAngle + angle;

    knob.style.transform = `rotate(${displayAngle}rad)`;

    if (this.previousAngle) {
        const dAngle = this.previousAngle - angle;
        if (dAngle > 5.0) {
            this.jumps++;
        } else if (dAngle < -5.0) {
            this.jumps--;
        }
    }
    this.previousAngle = angle;

    const totalAngle = angle + this.jumps * Math.PI * 2.0;

    const power = this.initialPower + this.scale * totalAngle / Math.PI / 2.0;
    canvas.setUniform('uPower', power, '1f');
}

function computeAngle(event) {
    const offsetX = event.pageX - this.centerX;
    const offsetY = this.centerY - event.pageY;
    let angle = Math.atan2(offsetY, offsetX);
    if (this.initialAngle)
        angle = this.initialAngle - angle;
    return angle;
}


function pointerUp(event) {
    knob.removeEventListener('pointermove', this.pointerMove);
    document.removeEventListener('pointerup', this.pointerUp);
    document.removeEventListener('pointercancel', this.pointerUp);

    knob.currentAngle += this.computeAngle(event);

    canvas.setUniform('uAntialiasing', true, '1i');
    canvas.setState('power');

    knob.releasePointerCapture(event.pointerId);
}
