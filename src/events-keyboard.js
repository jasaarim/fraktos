const canvas = document.querySelector('#gl-canvas');

export function pan(deltas) {
    const shift = canvas.getUniform('uShift');
    const scale = canvas.getUniform('uScale');
    for (const idx in deltas) {
        shift[idx] += scale * deltas[idx];
    }
    canvas.setUniform('uShift', shift, '2fv');
}


export function zoom(gain) {
    let scale = canvas.getUniform('uScale');
    scale *= gain;
    canvas.setUniform('uScale', scale, '1f');
}
