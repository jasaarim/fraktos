precision highp float;

uniform bool uAntialiasing;
uniform vec2 uWindowSize, uShift;
uniform float uScale;

uniform vec4 uShiftHiLo;

float SCALE_LIM = 0.00005;

int getIterations(float scale) {
    return 32 + int((1.0 / log(10.0)) * (log(1.0/scale)) * 64.0);
}


/** Many functions below to support double float operations
 *
 * When approaching the precision limit of f32, the operations switch to
 * using double f32 (for high and low floating point number) and this needs
 * many additional functions. The algorithm is described in
 * https://hal.archives-ouvertes.fr/hal-00021443 and
 * andrewthall.org/papers/df64_qf128.pdf.
 *
 */

vec2 add12(float a, float b) {
    float s = a + b;
    float v = s - a;
    float r = (a - (s - v)) + (b - v);
    return vec2(s, r);
}


vec2 split(float a) {
    float c = 4097.0 * a; // (pow(2.0, 12) + 1.0) * a;
    float aBig = c - a;
    float aHi = c - aBig;
    float aLo = a - aHi;
    return vec2(aHi, aLo);
}

vec2 mul12(float a, float b) {
    float x = a * b;
    vec2 aHiLo = split(a);
    vec2 bHiLo = split(b);
    float err1 = x - aHiLo.x * bHiLo.x;
    float err2 = err1 - aHiLo.y * bHiLo.x;
    float err3 = err2 - aHiLo.x * bHiLo.y;
    float y = aHiLo.y * bHiLo.y - err3;
    return vec2(x, y);
}

vec2 sqr12(float a) {
    float x = a * a;
    vec2 aHiLo = split(a);
    float err1 = x - aHiLo.x * aHiLo.x;
    float err2 = err1 - 2.0 * aHiLo.y * aHiLo.x;
    float y = aHiLo.y * aHiLo.y - err2;
    return vec2(x, y);
}

/* This is the addition form of andrewthall.org/papers/df64_qf128.pdf

vec2 add12q(float a, float b) {
    float s = a + b;
    float e = b - (s - a);
    return vec2(s, e);
}

vec2 add22(vec2 a, vec2 b) {
    vec2 s, t;
    s = add12(a.x, b.x);
    t = add12(a.y, b.y);
    s.y += t.x;
    s = add12q(s.x, s.y);
    s.y += t.y;
    s = add12q(s.x, s.y);
    return s;
}

*/

vec2 add22(vec2 a, vec2 b) {

    float r = a.x + b.x;
    float s;
    if (abs(a.x) >= abs(b.x)) {
        s = (((a.x - r) + b.x) + b.y) + a.y;
    } else {
        s = (((b.x - r) + a.x) + a.y) + b.y;
    }
    return add12(r, s);
}

vec2 mul22(vec2 a, vec2 b) {
    vec2 t12 = mul12(a.x, b.x);
    float t3 = ((a.x * b.y) + (a.y * b.x)) + t12.y;
    return add12(t12.x, t3);
}

vec2 sqr22(vec2 a) {
    vec2 t12 = sqr12(a.x);
    float t3 = 2.0 * a.x * a.y + t12.y;
    return add12(t12.x, t3);
}


vec2 mandelbrotStep(vec2 p, vec2 c) {
    return vec2(p.x * p.x - p.y * p.y, 2.0 * p.x * p.y) + c;
}


vec4 mandelbrotStep2(vec4 pHiLo, vec4 cHiLo) {
    vec2 pxpx = sqr22(pHiLo.xz);
    vec2 pypy = sqr22(pHiLo.yw);
    vec2 px2 = mul22(vec2(2.0, 0.0), pHiLo.xz);
    vec2 pxpy2 = mul22(px2, pHiLo.yw);
    vec2 pxpx_pypy = add22(pxpx, -pypy);
    vec2 pxpx_pypy_cx = add22(pxpx_pypy, cHiLo.xz);
    vec2 pxpy2_cy = add22(pxpy2, cHiLo.yw);
    // high X, high Y, low X, low Y
    return vec4(pxpx_pypy_cx.x, pxpy2_cy.x, pxpx_pypy_cx.y, pxpy2_cy.y);
}


bool escaped(vec2 p) {
    return (p.x * p.x + p.y * p.y) > 4.0;
}


float simpleIteration(vec2 pixelCoord, float scale, vec2 shift) {
    vec2 p = pixelCoord * scale + shift;
    vec2 c = p;

    int maxIter = getIterations(scale);

    float color = 0.0;
    for (int i = 0; i < 1000; i++) {
        p = mandelbrotStep(p, c);
        if (escaped(p)) {
            color = float(i) / float(maxIter);
            break;
        } else if (i > maxIter) {
            break;
        }
    }
    return color;
}

vec2 numHighLow(float num) {
    // Six decimal places
    float limit = 1e6;
    float high, low;
    if (num > 0.0) {
        high = floor(num * limit) / limit;
    } else {
        high = ceil(num * limit) / limit;
    }
    low = num - high;
    return vec2(high, low);
}

vec4 vec2HighLow(vec2 nums) {
     vec2 xHighLow = numHighLow(nums.x);
     vec2 yHighLow = numHighLow(nums.y);
     return vec4(xHighLow.x, yHighLow.x, xHighLow.y, yHighLow.y);
}


float doubleIteration(vec2 pixelCoord, float scale, vec4 shiftHiLo) {
    vec4 pixelCoordHiLo = vec2HighLow(pixelCoord * scale);
    //pixelCoordHiLo.zw = pixelCoord * scale;
    //pixelCoordHiLo.xy = vec2(0.0, 0.0);
    vec2 pXHiLo = add22(pixelCoordHiLo.xz, shiftHiLo.xz);
    vec2 pYHiLo = add22(pixelCoordHiLo.yw, shiftHiLo.yw);
    vec4 pHiLo = vec4(pXHiLo.x, pYHiLo.x, pXHiLo.y, pYHiLo.y);
    vec4 cHiLo = pHiLo;

    int maxIter = getIterations(scale);

    float color = 0.0;
    for (int i = 0; i < 1000; i++) {
        pHiLo = mandelbrotStep2(pHiLo, cHiLo);
        if (escaped(pHiLo.xy)) {
            color = float(i) / float(maxIter);
            break;
        } else if (i > maxIter) {
            break;
        }
    }
    return color;
}


vec2 pixelCoordinates(float x_offset, float y_offset) {
    vec2 fragCoord = vec2(gl_FragCoord.x + x_offset,
                          gl_FragCoord.y + y_offset);
    vec2 pixelCoord = 2.0 * (fragCoord.xy / uWindowSize - vec2(0.5, 0.5));
    pixelCoord.x = uWindowSize.x / uWindowSize.y * pixelCoord.x;

    return pixelCoord;
}


float antialiasingIteration(bool useDoubleFloat) {
    float color;
    float acolor = 0.0;
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            vec2 pixelCoord = pixelCoordinates(float(i) / 3.0, float(j) / 3.0);
            if (useDoubleFloat) {
                color = doubleIteration(pixelCoord, uScale, uShiftHiLo);
            } else {
                color = simpleIteration(pixelCoord, uScale, uShift);
            }
            acolor += color;
        }
    }
    acolor /= 3.0 * 3.0;

    return acolor;
}

float iteration(bool useDoubleFloat) {
    float color;
    vec2 pixelCoord = pixelCoordinates(0.0, 0.0);
    if (useDoubleFloat) {
        color = doubleIteration(pixelCoord, uScale, uShiftHiLo);
    } else {
        color = simpleIteration(pixelCoord, uScale, uShift);
    }
    return color;
}


void main() {

    float color;
    bool useDoubleFloat = uScale < SCALE_LIM;
    if (uAntialiasing) {
        color = antialiasingIteration(useDoubleFloat);
    } else {
        color = iteration(useDoubleFloat);
    }
    if (useDoubleFloat) {
        gl_FragColor = vec4(pow(color, 0.5), pow(color, 2.0), 0, 1.0);
    } else {
        gl_FragColor = vec4(pow(color, 2.0), pow(color, 0.5), color, 1.0);
    }
}
