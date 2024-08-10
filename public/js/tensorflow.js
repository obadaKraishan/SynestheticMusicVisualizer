async function analyzeMusic(filePath) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Attempt to decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Proceed with analysis as before
        const channelData = audioBuffer.getChannelData(0);
        let rms = 0;
        for (let i = 0; i < channelData.length; i++) {
            rms += channelData[i] ** 2;
        }
        rms = Math.sqrt(rms / channelData.length);

        // Calculate tempo (basic example)
        let tempo = 120; // Placeholder value
        if (audioBuffer.duration > 0) {
            tempo = (audioBuffer.sampleRate * 60) / (channelData.length / audioBuffer.duration);
        }

        // Spectral analysis (basic example)
        const fftSize = 2048;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Calculate spectral centroid as a feature
        let spectralCentroid = 0;
        for (let i = 0; i < bufferLength; i++) {
            spectralCentroid += i * dataArray[i];
        }
        spectralCentroid /= bufferLength;

        return {
            rms: rms,
            tempo: tempo,
            spectralCentroid: spectralCentroid,
            duration: audioBuffer.duration
        };
    } catch (error) {
        console.error('Error analyzing music:', error);
        throw error;
    }
}
