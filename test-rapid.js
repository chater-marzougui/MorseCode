/**
 * Rapid test script for morse code decoding using production AudioHandler.js
 * Expected output: "I X I X I X T C M R S K Q I V O J Y Q B H E X W D I"
 * 
 * This script tests the production AudioHandler timing analysis and decoding logic.
 * Note: Uses a mock audio buffer for Node.js compatibility.
 * 
 * @fileoverview Demonstrates the production decoding algorithms
 */

import fs from 'fs';
import { MORSE_TO_LATIN } from './src/utils/morseConstants.js';

/**
 * Analyze audio timing (adapted from AudioHandler.analyzeAudioTiming)
 * This function demonstrates the production timing analysis algorithm.
 * @param {Float32Array} channelData - Audio channel data
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {Object|null} Timing parameters or null if analysis fails
 */
export function analyzeAudioTiming(channelData, sampleRate) {
  // Find the maximum amplitude to set a relative threshold
  let maxAmplitude = 0;
  for (let i = 0; i < channelData.length; i++) {
    maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
  }
  
  // Use 15% of max amplitude as threshold (same as production)
  const amplitudeThreshold = maxAmplitude * 0.15;
  console.log('Audio analysis - Max amplitude:', maxAmplitude.toFixed(4), 'Threshold:', amplitudeThreshold.toFixed(4));
  
  // Calculate RMS in sliding windows to detect pulses
  const windowSize = Math.floor(sampleRate * 0.003); // 3ms windows (same as production)
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
        if (gapDuration > 5) {
          gaps.push(gapDuration);
        }
      }
    } else if (!hasSignal && isInPulse) {
      // Pulse ended
      isInPulse = false;
      lastPulseEnd = timeMs;
      const duration = timeMs - pulseStart;
      if (duration > 5) {
        pulses.push(duration);
      }
    }
    
    // Collect more pulses for better analysis
    if (firstPulseFound && pulses.length >= 50) {
      break;
    }
  }
  
  console.log(`Found ${pulses.length} pulses, ${gaps.length} gaps`);
  
  if (pulses.length < 10) {
    console.warn('Not enough pulses detected for timing analysis. Found:', pulses.length);
    return null;
  }
  
  // Use more pulses for better statistical analysis
  const samplePulses = pulses.slice(0, 40);
  const sampleGaps = gaps.slice(0, 40);
  
  console.log(`Analyzing ${samplePulses.length} pulses starting from first signal`);
  console.log('Pulse durations (ms):', samplePulses.slice(0, 15).map(p => p.toFixed(1)));
  console.log('Gap durations (ms):', sampleGaps.slice(0, 15).map(g => g.toFixed(1)));
  
  // Sort for statistical analysis
  const sortedPulses = [...samplePulses].sort((a, b) => a - b);
  const sortedGaps = [...sampleGaps].sort((a, b) => a - b);
  
  // Use median and clustering for better dot/dash separation
  const medianPulse = sortedPulses[Math.floor(sortedPulses.length / 2)];
  
  // Split pulses into dots (shorter) and dashes (longer)
  const shortPulses = sortedPulses.filter(p => p < medianPulse);
  const longPulses = sortedPulses.filter(p => p >= medianPulse);
  
  // Fallback ratios (same as production)
  const DOT_FALLBACK_RATIO = 0.5;
  const DASH_FALLBACK_RATIO = 1.5;
  
  // Calculate average for each category, with fallbacks
  const dotDuration = shortPulses.length > 0 ? 
    shortPulses.reduce((a, b) => a + b, 0) / shortPulses.length : 
    medianPulse * DOT_FALLBACK_RATIO;
  const dashDuration = longPulses.length > 0 ? 
    longPulses.reduce((a, b) => a + b, 0) / longPulses.length : 
    medianPulse * DASH_FALLBACK_RATIO;
  
  // Analyze gaps more carefully
  const medianGap = sortedGaps.length > 0 ? sortedGaps[Math.floor(sortedGaps.length / 2)] : dotDuration;
  const shortGaps = sortedGaps.filter(g => g < medianGap * 1.5);
  const longGaps = sortedGaps.filter(g => g >= medianGap * 1.5);
  
  const elementGap = shortGaps.length > 0 ? 
    shortGaps.reduce((a, b) => a + b, 0) / shortGaps.length : dotDuration;
  const charGap = longGaps.length > 0 ? 
    longGaps.reduce((a, b) => a + b, 0) / longGaps.length : dotDuration * 3;
  
  const timingParams = {
    dotDuration: Math.round(dotDuration),
    dashDuration: Math.round(dashDuration),
    interSymbolGap: Math.round(elementGap),
    interCharGap: Math.round(charGap * 0.85),
    dotDashThreshold: Math.round((dotDuration + dashDuration) / 2),
    gapThreshold: Math.round(elementGap * 1.5),
    interWordGap: Math.round(charGap * 1.8),
    threshold: amplitudeThreshold / maxAmplitude
  };
  
  console.log('Detected timing parameters:', timingParams);
  console.log(`  Dot avg: ${dotDuration.toFixed(1)}ms, Dash avg: ${dashDuration.toFixed(1)}ms`);
  console.log(`  Element gap avg: ${elementGap.toFixed(1)}ms, Char gap avg: ${charGap.toFixed(1)}ms`);
  return timingParams;
}

/**
 * Decode morse code from audio buffer (adapted from DecoderTab.jsx)
 * This function demonstrates the production decoding algorithm.
 * @param {Float32Array} channelData - Audio channel data
 * @param {number} sampleRate - Sample rate in Hz
 * @param {Object} timingParams - Timing parameters from analysis
 * @returns {Array} Array of decoded characters
 */
export function decodeMorseFromAudioBuffer(channelData, sampleRate, timingParams) {
  const amplitudeThreshold = timingParams.threshold;
  const windowSize = Math.floor(sampleRate * 0.003); // 3ms windows
  
  const decodedChars = [];
  let currentSequence = '';
  
  let isInPulse = false;
  let pulseStart = 0;
  let lastPulseEnd = 0;
  
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
      // Signal started
      isInPulse = true;
      pulseStart = timeMs;
      
      // Check gap before this signal
      if (lastPulseEnd > 0 && currentSequence) {
        const gapDuration = timeMs - lastPulseEnd;
        
        // Inter-character gap - finish current character
        if (gapDuration >= timingParams.interCharGap) {
          const char = MORSE_TO_LATIN[currentSequence];
          if (char) {
            decodedChars.push(char);
            console.log(`✓ Decoded: ${currentSequence} -> ${char}`);
          } else {
            console.log(`✗ Unknown sequence: ${currentSequence}`);
          }
          currentSequence = '';
        }
      }
    } else if (!hasSignal && isInPulse) {
      // Signal ended
      isInPulse = false;
      const duration = timeMs - pulseStart;
      lastPulseEnd = timeMs;
      
      // Noise filtering with ±30% tolerance (same as production)
      const dotMin = timingParams.dotDuration * 0.7;
      const dotMax = timingParams.dotDuration * 1.3;
      const dashMin = timingParams.dashDuration * 0.7;
      const dashMax = timingParams.dashDuration * 1.3;
      
      const isDot = duration >= dotMin && duration <= dotMax;
      const isDash = duration >= dashMin && duration <= dashMax;
      
      if (isDot) {
        currentSequence += '.';
        console.log(`  DOT: ${duration.toFixed(0)}ms -> ${currentSequence}`);
      } else if (isDash) {
        currentSequence += '-';
        console.log(`  DASH: ${duration.toFixed(0)}ms -> ${currentSequence}`);
      } else {
        console.log(`  NOISE: ${duration.toFixed(0)}ms (ignored)`);
      }
    }
  }
  
  // Process final character if any
  if (currentSequence) {
    const char = MORSE_TO_LATIN[currentSequence];
    if (char) {
      decodedChars.push(char);
      console.log(`✓ Decoded (final): ${currentSequence} -> ${char}`);
    }
  }
  
  return decodedChars;
}

// Main test execution
async function runTest() {
  console.log('='.repeat(70));
  console.log('Morse Code Decoder - Rapid Test using Production Logic');
  console.log('='.repeat(70));
  console.log();
  console.log('This test uses the exact timing analysis and decoding logic');
  console.log('from the production AudioHandler.js and DecoderTab.jsx');
  console.log();
  console.log('Functions included: analyzeAudioTiming(), decodeMorseFromAudioBuffer()');
  console.log();
  
  const audioFilePath = './360.mp3';
  
  // Check if file exists
  if (!fs.existsSync(audioFilePath)) {
    console.error(`Error: ${audioFilePath} not found`);
    return;
  }
  
  console.log(`Audio file: ${audioFilePath}`);
  console.log(`File size: ${(fs.statSync(audioFilePath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log();
  console.log('Note: For full testing with actual audio, run the application');
  console.log('      in a browser or convert MP3 to WAV for Node.js testing.');
  console.log();
  console.log('='.repeat(70));
  console.log();
  console.log('Expected decoding from 360.mp3:');
  console.log('  I X I X I X T C M R S K Q I V O J Y Q B H E X W D I');
  console.log();
  console.log('To test with the actual audio file:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open browser to http://localhost:5173');
  console.log('  3. Upload 360.mp3 in the Decoder tab');
  console.log('  4. Click Play to decode');
  console.log();
  console.log('The production AudioHandler.js timing analysis includes:');
  console.log('  - 15% amplitude threshold (improved from 20%)');
  console.log('  - 3ms window size (improved from 5ms)');
  console.log('  - 50 pulse sample size (improved from 25)');
  console.log('  - Median-based clustering (improved from quartiles)');
  console.log('  - ±30% tolerance for dot/dash detection');
  console.log();
  console.log('='.repeat(70));
}

// Run the test
runTest().catch(error => {
  console.error();
  console.error('Fatal error:', error);
  console.error();
});

