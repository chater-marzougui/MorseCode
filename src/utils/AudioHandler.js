import { DOT_DURATION_MS, MORSE_CODE_MAP, MORSE_TO_LATIN } from './morseConstants';

export class AudioHandler {
  constructor() {
    this.audioContext = null;
    this.source = null;
    this.analyser = null;
    this.audioBuffer = null;
    this.isPlaying = false;
    this.startTime = 0;
    
    // For decoding
    this.threshold = 0.5; // Amplitude threshold
    this.sampleRate = 44100;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
    }
  }

  async loadAudio(file) {
    this.init();
    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    return this.audioBuffer;
  }

  play(onEnded) {
    if (!this.audioBuffer || this.isPlaying) return;
    this.init();
    
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    this.source.onended = () => {
      this.isPlaying = false;
      if (onEnded) onEnded();
    };

    this.source.start(0);
    this.startTime = this.audioContext.currentTime;
    this.isPlaying = true;
  }

  stop() {
    if (this.source && this.isPlaying) {
      this.source.stop();
      this.source.disconnect();
      this.isPlaying = false;
    }
  }

  playTone(dotOrDash) { // '.', '-', or sequence '.-'
    this.init();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    // Simple implementation for single tone, needs sequencing for full chars
    // This is a placeholder for single beep
    osc.frequency.value = 600;
    osc.start();
    gain.gain.setValueAtTime(1, this.audioContext.currentTime);
    
    const duration = dotOrDash === '.' ? DOT_DURATION_MS / 1000 : (DOT_DURATION_MS * 3) / 1000;
    
    gain.gain.setTargetAtTime(0, this.audioContext.currentTime + duration, 0.01);
    osc.stop(this.audioContext.currentTime + duration + 0.05);
  }

  playMorseSequence(sequence) {
      // Play a full sequence like ".-"
      this.init();
      let time = this.audioContext.currentTime;
      const dot = 0.06; // 60ms
      
      sequence.split('').forEach(symbol => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          
          osc.frequency.value = 600;
          const duration = symbol === '.' ? dot : dot * 3;
          
          osc.start(time);
          gain.gain.setValueAtTime(1, time);
          gain.gain.setTargetAtTime(0, time + duration, 0.005);
          osc.stop(time + duration + 0.005);
          
          time += duration + dot; // Inter-symbol gap
      });
  }

  getByteFrequencyData() {
      if (!this.analyser) return new Uint8Array(0);
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray;
  }
  
  getByteTimeDomainData() {
      if (!this.analyser) return new Uint8Array(0);
      const dataArray = new Uint8Array(this.analyser.fftSize);
      this.analyser.getByteTimeDomainData(dataArray);
      return dataArray;
  }

  /**
   * Analyze the entire audio buffer to detect timing characteristics
   * Returns: { dotDuration, dashDuration, interSymbolGap, interCharGap, threshold }
   */
  analyzeAudioTiming() {
      if (!this.audioBuffer) return null;
      
      const channelData = this.audioBuffer.getChannelData(0);
      const sampleRate = this.audioBuffer.sampleRate;
      
      // Find the maximum amplitude to set a relative threshold
      let maxAmplitude = 0;
      for (let i = 0; i < channelData.length; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
      }
      
      // Use 20% of max amplitude as threshold
      const amplitudeThreshold = maxAmplitude * 0.2;
      console.log('Audio analysis - Max amplitude:', maxAmplitude.toFixed(4), 'Threshold:', amplitudeThreshold.toFixed(4));
      
      // Calculate RMS in sliding windows to detect pulses
      const windowSize = Math.floor(sampleRate * 0.005); // 5ms windows
      const pulses = [];
      const gaps = [];
      
      let isInPulse = false;
      let pulseStart = 0;
      let lastPulseEnd = 0;
      let firstPulseFound = false;
      
      for (let i = 0; i < channelData.length; i += windowSize) {
          // Calculate RMS for this window
          let sumSquares = 0;
          const end = Math.min(i + windowSize, channelData.length);
          for (let j = i; j < end; j++) {
              sumSquares += channelData[j] * channelData[j];
          }
          const rms = Math.sqrt(sumSquares / (end - i));
          
          const hasSignal = rms > amplitudeThreshold;
          const timeMs = (i / sampleRate) * 1000;
          
          if (hasSignal && !isInPulse) {
              // Pulse started
              isInPulse = true;
              pulseStart = timeMs;
              firstPulseFound = true;
              
              // Record gap duration
              if (lastPulseEnd > 0) {
                  const gapDuration = timeMs - lastPulseEnd;
                  if (gapDuration > 10) {
                      gaps.push(gapDuration);
                  }
              }
          } else if (!hasSignal && isInPulse) {
              // Pulse ended
              isInPulse = false;
              lastPulseEnd = timeMs;
              const duration = timeMs - pulseStart;
              if (duration > 10) { // Ignore very short noise
                  pulses.push(duration);
              }
          }
          
          // Stop after collecting enough pulses (after first pulse is found)
          if (firstPulseFound && pulses.length >= 25) {
              break;
          }
      }
      
      console.log(`Found ${pulses.length} pulses, ${gaps.length} gaps`);
      
      if (pulses.length < 10) {
          console.warn('Not enough pulses detected for timing analysis. Found:', pulses.length);
          return null;
      }
      
      // Use first 20 pulses for analysis
      const samplePulses = pulses.slice(0, 20);
      const sampleGaps = gaps.slice(0, 20);
      
      console.log(`Analyzing ${samplePulses.length} pulses starting from first signal`);
      console.log('Pulse durations (ms):', samplePulses.slice(0, 10).map(p => p.toFixed(1)));
      console.log('Gap durations (ms):', sampleGaps.slice(0, 10).map(g => g.toFixed(1)));
      
      // Sort for quartile analysis
      const sortedPulses = [...samplePulses].sort((a, b) => a - b);
      const sortedGaps = [...sampleGaps].sort((a, b) => a - b);
      
      // Use quartiles for better clustering
      const dotDuration = sortedPulses[Math.floor(sortedPulses.length * 0.25)]; // Lower quartile
      const dashDuration = sortedPulses[Math.floor(sortedPulses.length * 0.75)]; // Upper quartile
      
      // Gaps: element gaps (short), character gaps (medium)
      const elementGap = sortedGaps.length > 0 ? sortedGaps[Math.floor(sortedGaps.length * 0.25)] : dotDuration;
      const charGap = sortedGaps.length > 0 ? sortedGaps[Math.floor(sortedGaps.length * 0.6)] : dotDuration * 3;
      
      const timingParams = {
          dotDuration: Math.round(dotDuration),
          dashDuration: Math.round(dashDuration),
          interSymbolGap: Math.round(elementGap),
          interCharGap: Math.round(charGap * 0.9),
          dotDashThreshold: Math.round((dotDuration + dashDuration) / 2),
          gapThreshold: Math.round(elementGap * 1.2),
          interWordGap: Math.round(charGap * 2),
          threshold: amplitudeThreshold / maxAmplitude // Normalize to 0-1 for RMS comparison
      };
      
      console.log('Detected timing parameters:', timingParams);
      return timingParams;
  }

}

export const audioHandler = new AudioHandler();
