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

    fillCanvas(gl, shaderProgram);

    canvas.gl = gl;
    canvas.shaderProgram = shaderProgram;
    canvas.draw = draw;
    canvas.setUniform = setUniform;
    canvas.getUniform = getUniform;

    canvas.eventCache = {};

    canvas.resize = resize;
    canvas.draw = draw;

    canvas.setUniform('uScale', 3.25, '1f');
    canvas.resize();
}


function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: '
              + gl.getProgramInfoLog(shaderProgram));
        return;
    }

    gl.useProgram(shaderProgram);

    return shaderProgram;
}


function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: '
              + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}


function fillCanvas(gl, shaderProgram) {
    const positionBuffer = gl.createBuffer();
    const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');

    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);
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
        console.log(value);
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
