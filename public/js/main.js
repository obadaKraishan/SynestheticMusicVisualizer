document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('musicFile', document.getElementById('musicFile').files[0]);

    const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (data.filePath) {
        // Proceed with visualizing the music file
        console.log('File uploaded successfully:', data.filePath);
        // Initialize WebGL visualizer here
    } else {
        console.error('Upload failed.');
    }
});

// WebGL initialization and rendering code will go here
