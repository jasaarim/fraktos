import { initShaderProgram } from './canvas-shaders.js';


const INITIAL_STATE = {
    scale: 3.25,
    shift: [0, 0]
}

const PARAM_MAPPING = {
    scale: ['uScale', '1f'],
    shift: ['uShift', '2fv']
}


async function initialize() {
    const canvas = document.querySelector('#gl-canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL');
        return;
    }

    const vsSource = await fetch('src/shader.vert')
          .then(response => response.text());
    const fsSource = await fetch('src/shader.frag')
          .then(response => response.text());
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    canvas.gl = gl;
    canvas.shaderProgram = shaderProgram;
    canvas.draw = draw;
    canvas.setUniform = setUniform;
    canvas.getUniform = getUniform;

    canvas.eventCache = {};

    canvas.resize = resize;
    canvas.draw = draw;
    canvas.getState = getState;
    canvas.setState = setState;

    canvas.getState(false, true);
    canvas.resize();
}


function getState(initial, fallback) {
    const params = new URLSearchParams(window.location.search);
    for (name in INITIAL_STATE) {
        if (!initial && params.get(name)) {
            let value = params.get(name);
            if (value.includes(',')) {
                value = value.split(',');
            }
            const uniform = PARAM_MAPPING[name][0];
            const type = PARAM_MAPPING[name][1];
            this.setUniform(uniform, value, type);
        } else if (initial || fallback) {
            const value = INITIAL_STATE[name];
            const uniform = PARAM_MAPPING[name][0];
            const type = PARAM_MAPPING[name][1];
            this.setUniform(uniform, value, type);
        }
    }
}


function setState(...params) {
    const searchParams = new URLSearchParams(window.location.search);
    for (const param of params) {
        const value = this.getUniform(PARAM_MAPPING[param][0]);
        searchParams.set(param, value);
    }
    const newURL = window.location.pathname + '?' + searchParams.toString();
    history.pushState(null, '', newURL);
}


function draw() {
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    // Not sure if this is needed
    this.gl.flush();
}


function resize() {
    const displayWidth = this.clientWidth;
    const displayHeight = this.clientHeight;

    if (this.width != displayWidth || this.height != displayHeight) {
        this.width = displayWidth;
        this.height = displayHeight;
    }
    this.gl.viewport(0, 0, displayWidth, displayHeight);

    this.setUniform('uWindowSize', [displayWidth, displayHeight], '2fv');
    this.unitPixels = displayHeight / 2;

    this.draw();
}


function setUniform(name, value, type) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (type == '2fv')
        this.gl.uniform2fv(location, value);
    else if (type == '4fv')
        this.gl.uniform4fv(location, value);
    else if (type == '1f')
        this.gl.uniform1f(location, value);
    else
        console.error(`Unknown uniform type "${type}"`)

    if (name == 'uScale') {
        if (value < 3.0 && !this.classList.contains('zoomed'))
            this.classList.add('zoomed');
        else if (value >= 3.0 && this.classList.contains('zoomed'))
            this.classList.remove('zoomed');
    } else if (name == 'uShift') {
        let highLow = shiftHighLow(value);
        this.setUniform('uShiftHiLo', highLow, '4fv');
    }
    this.draw();
}


function shiftHighLow(shift) {
    const xHighLow = numHighLow(shift[0]);
    const yHighLow = numHighLow(shift[1]);
    return [xHighLow[0], yHighLow[0], xHighLow[1], yHighLow[1]];
}


function numHighLow(num) {
    // Six decimal places
    const limit = 1e6;
    let high, low;
    if (num > 0)
        high = Math.floor(num * limit) / limit;
    else
        high = Math.ceil(num * limit) / limit;
    low = num - high;
    return [high, low];
}


function getUniform(name) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    return this.gl.getUniform(this.shaderProgram, location);
}


initialize();
