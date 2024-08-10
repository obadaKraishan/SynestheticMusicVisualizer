const canvas = document.createElement('canvas');
canvas.width = document.getElementById('visualizer').clientWidth;
canvas.height = document.getElementById('visualizer').clientHeight;
document.getElementById('visualizer').appendChild(canvas);

const gl = canvas.getContext('webgl');

// Define basic vertex and fragment shaders
const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  void main(void) {
    gl_Position = aVertexPosition;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 uColor;
  void main(void) {
    gl_FragColor = uColor;
  }
`;

// Compile shaders
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

// Create and link the shader program
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
}

// Initialize buffers and attributes
const vertices = new Float32Array([
    -0.5, 0.5,
    0.5, 0.5,
    -0.5, -0.5,
    0.5, -0.5
]);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const aVertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
gl.enableVertexAttribArray(aVertexPosition);
gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

const uColor = gl.getUniformLocation(shaderProgram, 'uColor');

// Function to render the scene
function render() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    gl.uniform4f(uColor, Math.random(), Math.random(), Math.random(), 1.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

// Start rendering
render();
