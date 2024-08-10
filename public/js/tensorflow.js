async function analyzeMusic(filePath) {
    // Load the music file as an audio buffer
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Extract features (for simplicity, we'll just calculate the RMS energy here)
    const channelData = audioBuffer.getChannelData(0); // Use the first channel
    let rms = 0;
    for (let i = 0; i < channelData.length; i++) {
        rms += channelData[i] ** 2;
    }
    rms = Math.sqrt(rms / channelData.length);

    // Return the analyzed features
    return {
        rms: rms,
        duration: audioBuffer.duration
    };
}

// Example usage: call analyzeMusic after uploading the file
async function processMusic(filePath) {
    const features = await analyzeMusic(filePath);
    console.log('Music features:', features);

    // You can now use these features to control the WebGL visuals in main.js
}
