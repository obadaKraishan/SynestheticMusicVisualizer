const canvas = document.createElement('canvas');
canvas.width = document.getElementById('visualizer').clientWidth;
canvas.height = document.getElementById('visualizer').clientHeight;
document.getElementById('visualizer').appendChild(canvas);

const gl = canvas.getContext('webgl');

const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  varying vec2 vTextureCoord;
  void main(void) {
    gl_Position = aVertexPosition;
    vTextureCoord = aVertexPosition.xy * 0.5 + 0.5;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec2 vTextureCoord;
  uniform float uTime;
  uniform vec4 uColor;
  void main(void) {
    float brightness = 0.5 + 0.5 * sin(uTime * 10.0 + vTextureCoord.x * 10.0);
    float beatEffect = sin(uTime * 2.0) * 0.5 + 0.5;
    vec3 color = mix(uColor.rgb * brightness, vec3(beatEffect, 0.0, 1.0 - beatEffect), vTextureCoord.y);
    gl_FragColor = vec4(color, 1.0);
  }
`;

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

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
}

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
const uTime = gl.getUniformLocation(shaderProgram, 'uTime');

let audioElement;
let features;

async function processMusic(filePath) {
    features = await analyzeMusic(filePath);
    console.log('Music features:', features);

    audioElement = new Audio();
    audioElement.src = filePath;
    audioElement.play();

    audioElement.addEventListener('play', render);
}

function render() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    const time = performance.now() / 1000.0;
    gl.uniform1f(uTime, time);

    let avgFrequency = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    avgFrequency /= 255; // Normalize
    gl.uniform4f(uColor, avgFrequency, Math.random(), 1.0 - avgFrequency, 1.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('musicFile');
    const file = fileInput.files[0];

    if (!file) {
        console.error('No file selected.');
        return;
    }

    const formData = new FormData();
    formData.append('musicFile', file);

    console.log('Uploading file:', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.filePath) {
            console.log('File uploaded successfully:', data.filePath);
            processMusic(data.filePath);
        } else {
            console.error('Upload failed.');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
    }
});

document.getElementById('playPauseBtn').addEventListener('click', () => {
    if (audioElement.paused) {
        audioElement.play();
    } else {
        audioElement.pause();
    }
});
