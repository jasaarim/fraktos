const canvas = document.querySelector('#gl-canvas');


export function panZoom(event) {
    const data = {
        initialX: event.pageX,
        initialY: event.pageY,
        initialShift: canvas.getUniform('uShift'),
        scale: canvas.getUniform('uScale'),
        distanceBetween: null
    };

    canvas.eventCache[event.pointerId] = event;

    data.pointerMove = pointerMove.bind(data);
    data.pointerUp = pointerUp.bind(data);

    canvas.setPointerCapture(event.pointerId);

    canvas.addEventListener('pointermove', data.pointerMove);
    canvas.addEventListener('pointerup', data.pointerUp);
    canvas.addEventListener('pointercancel', data.pointerUp);
}


function pointerMove(event) {
    canvas.eventCache[event.pointerId] = event;
    if (Object.keys(canvas.eventCache).length == 2) {
        const keys = Object.keys(canvas.eventCache);
        const ev1 = canvas.eventCache[keys[0]];
        const ev2 = canvas.eventCache[keys[1]];
        const dx = ev1.pageX - ev2.pageX;
        const dy = ev1.pageY - ev2.pageY;
        const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        if (event.pointerId == keys[0]) {
            if (!this.distanceBetween) {
                this.distanceBetween = distance;
            } else  {
                const scale = this.distanceBetween / distance * this.scale;
                canvas.setUniform('uScale', scale, '1f');
            }
        }
    } else {
        const dx = this.scale * (this.initialX - event.pageX) / canvas.unitPixels;
        const dy = this.scale * (this.initialY - event.pageY) / canvas.unitPixels;
        const shift = this.initialShift;
        canvas.setUniform('uShift', [shift[0] + dx, shift[1] - dy], '2fv');
    }
}

function pointerUp(event) {
    canvas.removeEventListener('pointermove', this.pointerMove);
    canvas.removeEventListener('pointerup', this.pointerUp);
    canvas.removeEventListener('pointercancel', this.pointerUp);

    if (event.pointerId in canvas.eventCache) {
        delete canvas.eventCache[event.pointerId];
    } else {
        canvas.eventCache = {};
    }

    canvas.releasePointerCapture(event.pointerId);
}
