/**
 * Plays a paper tearing sound effect when a user successfully checks in
 * Simulates the satisfying sound of tearing a coupon from a sheet
 */
export const playStampSound = () => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    const sampleRate = audioContext.sampleRate;
    const duration = 0.2; // 200ms - quick tear sound
    const bufferLength = Math.floor(sampleRate * duration);
    
    // Create master gain node for overall volume control
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.setValueAtTime(0.35, now);
    
    // Create noise buffer for paper tearing texture
    const noiseBuffer = audioContext.createBuffer(1, bufferLength, sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    
    // Generate pink noise (more natural than white noise for paper sounds)
    // Pink noise has more energy in lower frequencies, which sounds more like paper
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      noiseData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      noiseData[i] *= 0.11; // Scale down
      b6 = white * 0.115926;
    }
    
    // Create buffer source for the noise
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    // Bandpass filter to focus on paper-tearing frequencies (200Hz - 4000Hz)
    const bandpassFilter = audioContext.createBiquadFilter();
    bandpassFilter.type = 'bandpass';
    bandpassFilter.frequency.setValueAtTime(1200, now);
    bandpassFilter.Q.setValueAtTime(2, now);
    
    // Highpass filter to remove very low frequencies
    const highpassFilter = audioContext.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.setValueAtTime(300, now);
    
    // Lowpass filter to remove very high frequencies (paper doesn't have sharp highs)
    const lowpassFilter = audioContext.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.setValueAtTime(3500, now);
    
    // Envelope for the tearing sound - quick attack, quick decay
    const tearGain = audioContext.createGain();
    tearGain.gain.setValueAtTime(0, now);
    tearGain.gain.linearRampToValueAtTime(0.9, now + 0.01); // Quick attack
    tearGain.gain.linearRampToValueAtTime(0.7, now + 0.05); // Slight sustain
    tearGain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Quick decay
    
    // Connect: noise -> bandpass -> highpass -> lowpass -> gain -> master
    noiseSource.connect(bandpassFilter);
    bandpassFilter.connect(highpassFilter);
    highpassFilter.connect(lowpassFilter);
    lowpassFilter.connect(tearGain);
    tearGain.connect(masterGain);
    
    // Add a brief "snap" at the beginning - like the initial tear
    const snapOsc = audioContext.createOscillator();
    const snapGain = audioContext.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(800, now);
    snapOsc.frequency.exponentialRampToValueAtTime(400, now + 0.02);
    
    snapGain.gain.setValueAtTime(0, now);
    snapGain.gain.linearRampToValueAtTime(0.3, now + 0.001);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
    
    snapOsc.connect(snapGain);
    snapGain.connect(masterGain);
    
    // Start both sources
    noiseSource.start(now);
    snapOsc.start(now);
    
    // Stop sources
    noiseSource.stop(now + duration);
    snapOsc.stop(now + 0.02);
    
    // Clean up after sound finishes
    noiseSource.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    // Silently fail if audio context is not available or user hasn't interacted yet
    console.debug('Could not play stamp sound:', error);
  }
};
