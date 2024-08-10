document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.width = document.getElementById('visualizer').clientWidth;
    canvas.height = document.getElementById('visualizer').clientHeight;
    document.getElementById('visualizer').appendChild(canvas);

    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser or machine may not support it.');
        alert('WebGL not supported');
    }

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
        float wave = sin(vTextureCoord.x * 10.0 + uTime * 2.0) * 0.5 + 0.5;
        float ripple = sin(distance(vTextureCoord, vec2(0.5, 0.5)) * 20.0 - uTime * 3.0);
        float brightness = wave * ripple;
        vec3 color = uColor.rgb * brightness;
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

    // Verify that everything is correctly set up before rendering
    gl.useProgram(shaderProgram);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

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
    let particles = [];

    function createParticle() {
        return {
            position: [Math.random() - 0.5, Math.random() - 0.5],
            velocity: [Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01],
            life: Math.random() * 2.0
        };
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.position[0] += p.velocity[0];
            p.position[1] += p.velocity[1];
            p.life -= 0.1;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        while (particles.length < 100) {
            particles.push(createParticle());
        }
    }

    function renderParticles(gl) {
        particles.forEach(p => {
            gl.uniform2f(gl.getUniformLocation(shaderProgram, 'uParticlePos'), p.position[0], p.position[1]);
            gl.drawArrays(gl.POINTS, 0, 1);
        });
    }

    async function processMusic(filePath) {
        try {
            features = await analyzeMusic(filePath);
            console.log('Music features:', features);

            audioElement = new Audio();
            audioElement.src = filePath;
            audioElement.play();

            audioElement.addEventListener('play', render);
        } catch (error) {
            console.error('Error processing music:', error);
            alert('Failed to process the music file. Please try again.');
        }
    }

    function render() {
        updateParticles();

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(shaderProgram);

        const time = performance.now() / 1000.0;
        gl.uniform1f(uTime, time);

        renderParticles(gl);

        requestAnimationFrame(render);
    }

    document.getElementById('uploadForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'block';

        const fileInput = document.getElementById('musicFile');
        const file = fileInput.files[0];

        if (!file) {
            console.error('No file selected.');
            document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner if no file
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
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner after processing
        }
    });

    document.getElementById('playPauseBtn').addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            document.getElementById('playPauseBtn').textContent = "Pause";
        } else {
            audioElement.pause();
            document.getElementById('playPauseBtn').textContent = "Play";
        }
    });

    document.getElementById('visualMode').addEventListener('change', (event) => {
        currentMode = event.target.value;
    });

    document.getElementById('volumeControl').addEventListener('input', function() {
        audioElement.volume = this.value;
    });
});
