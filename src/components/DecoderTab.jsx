import { useState, useRef } from 'react';
import { audioHandler } from '../utils/AudioHandler';
import { MORSE_TO_LATIN, LATIN_TO_ARABIC } from '../utils/morseConstants';

const DecoderTab = () => {
  const [decodedChars, setDecodedChars] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState('');
  const [timingParams, setTimingParams] = useState(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  
  // Decoding state
  const signalState = useRef({
    on: false,
    startTime: 0,
    lastOffTime: 0,
    sequence: '',
    cursorX: 0,
    buffer: [] // Add buffer for smoother detection
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      await audioHandler.loadAudio(file);
      
      const params = audioHandler.analyzeAudioTiming();
      if (params) {
        setTimingParams(params);
        console.log('Using adaptive timing:', params);
      } else {
        setTimingParams({
          dotDuration: 80,
          dashDuration: 240,
          dotDashThreshold: 120,
          gapThreshold: 120,
          interCharGap: 240,
          interWordGap: 560,
          threshold: 0.05
        });
      }
    }
  };

  const processCharacter = (ctx, width, height) => {
    const seq = signalState.current.sequence;
    if (!seq) return;
    
    const char = MORSE_TO_LATIN[seq];
    if (char) {
      setDecodedChars(prev => [...prev, char]);
      console.log(`Decoded: ${seq} -> ${char}`);
    } else {
      console.log(`Unknown sequence: ${seq}`);
    }
    signalState.current.sequence = '';
  };

  const handlePlayLoop = () => {
    if (!timingParams) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    
    // Get amplitude data with RMS calculation
    const data = audioHandler.getByteTimeDomainData();
    let sumSquares = 0;
    for(let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128.0;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    
    const isSignal = rms > timingParams.threshold;
    const now = performance.now(); // More accurate than Date.now()
    
    // --- IMPROVED DECODING LOGIC ---
    if (isSignal && !signalState.current.on) {
      // Signal started (rising edge)
      signalState.current.on = true;
      signalState.current.startTime = now;
      
      // Check gap before this signal
      if (signalState.current.lastOffTime > 0 && signalState.current.sequence) {
        const gapDuration = now - signalState.current.lastOffTime;
        
        // Inter-character gap - finish current character
        if (gapDuration >= timingParams.interCharGap) {
          processCharacter(ctx, width, height);
        }
      }
    } 
    else if (!isSignal && signalState.current.on) {
      // Signal ended (falling edge)
      signalState.current.on = false;
      const duration = now - signalState.current.startTime;
      signalState.current.lastOffTime = now;
      
      // Noise filtering with ±25% tolerance (wider to account for real-time timing variance)
      const dotMin = timingParams.dotDuration * 0.75;
      const dotMax = timingParams.dotDuration * 1.25;
      const dashMin = timingParams.dashDuration * 0.75;
      const dashMax = timingParams.dashDuration * 1.25;
      
      // Check if duration fits either dot or dash range
      const isDot = duration >= dotMin && duration <= dotMax;
      const isDash = duration >= dashMin && duration <= dashMax;
      
      if (isDot) {
        signalState.current.sequence += '.';
        console.log(`✓ DOT: ${duration.toFixed(0)}ms (expected: ${timingParams.dotDuration}ms) -> ${signalState.current.sequence}`);
      } else if (isDash) {
        signalState.current.sequence += '-';
        console.log(`✓ DASH: ${duration.toFixed(0)}ms (expected: ${timingParams.dashDuration}ms) -> ${signalState.current.sequence}`);
      } else {
        // Noise - ignore this signal
        console.log(`✗ NOISE: ${duration.toFixed(0)}ms (expected dot: ${timingParams.dotDuration}ms ±25% or dash: ${timingParams.dashDuration}ms ±25%)`);
      }
    }
    else if (!isSignal && !signalState.current.on && signalState.current.lastOffTime > 0) {
      // Continuing silence - check for character/word boundaries
      const silenceDuration = now - signalState.current.lastOffTime;
      
      if (signalState.current.sequence && silenceDuration >= timingParams.interCharGap) {
        processCharacter(ctx, width, height);
      }
    }
    
    // --- GRAPH DRAWING (scrolling visualization) ---
    const x = signalState.current.cursorX;
    
    if (x >= width) {
      // Scroll the canvas left
      const imageData = ctx.getImageData(2, 0, width - 2, height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      ctx.putImageData(imageData, 0, 0);
      signalState.current.cursorX = width - 2;
    }
    
    const drawX = signalState.current.cursorX;
    const barHeight = rms * 300;
    
    if (isSignal) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(drawX, (height - barHeight) / 2, 2, barHeight);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(drawX, height / 2 - 1, 2, 2);
    }
    
    signalState.current.cursorX += 2;

    // Continue animation or stop
    if (audioHandler.isPlaying) {
      requestRef.current = requestAnimationFrame(handlePlayLoop);
    } else {
      // Audio ended - process final character if any
      if (signalState.current.sequence) {
        processCharacter(ctx, width, height);
      }
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioHandler.stop();
      cancelAnimationFrame(requestRef.current);
      setIsPlaying(false);
    } else {
      if (!timingParams) {
        alert('Please wait for timing analysis to complete');
        return;
      }
      
      setDecodedChars([]);
      signalState.current = {
        on: false,
        startTime: 0,
        lastOffTime: 0,
        sequence: '',
        cursorX: 0,
        buffer: []
      };
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      audioHandler.play(() => {
        // Process final character when audio ends
        if (signalState.current.sequence) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            processCharacter(ctx, canvas.width, canvas.height);
          }
        }
        setIsPlaying(false);
      });
      setIsPlaying(true);
      requestRef.current = requestAnimationFrame(handlePlayLoop);
    }
  };

  return (
    <div className="space-y-6">
      {/* Audio Input Block */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 block bg-gray-200 p-2 -mx-6 -mt-6 rounded-t-xl">Audio Input</h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Recorded Audio File</label>
            <div className="flex space-x-2">
              <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center">
                <span>Upload</span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
              </label>
              <button 
                onClick={togglePlay}
                disabled={!fileName || !timingParams}
                className={`px-6 py-2 rounded text-white font-medium ${fileName && timingParams ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {isPlaying ? 'Stop' : 'Play'}
              </button>
              <span className="self-center text-gray-500 font-mono text-sm">
                File: "{fileName || 'None'}"
                {timingParams && <span className="ml-2 text-green-600">✓ Analyzed</span>}
              </span>
            </div>
            {timingParams && (
              <div className="mt-2 text-xs text-gray-500 font-mono">
                Dot: {timingParams.dotDuration}ms | Dash: {timingParams.dashDuration}ms | 
                Threshold: {timingParams.dotDashThreshold}ms | Gap: {timingParams.interCharGap}ms
              </div>
            )}
          </div>
          
          <div className="flex-1 opacity-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">Microphone</label>
            <button disabled className="px-4 py-2 border border-gray-300 rounded text-gray-400">Listen</button>
            <button disabled className="px-4 py-2 border border-gray-300 rounded text-gray-400 ml-2">Stop</button>
          </div>
        </div>
      </div>

      {/* Received Data Block */}
      <div className="bg-gray-100 p-0 rounded-none shadow-sm border border-gray-300 overflow-hidden">
        <h3 className="text-sm font-semibold text-white bg-gray-400 p-1 pl-2 text-left">Received Data</h3>
        <div className="p-8 min-h-[140px] bg-gray-200 flex flex-wrap justify-start gap-8 text-3xl font-sans tracking-wider">
          {decodedChars.length === 0 && <span className="text-gray-400 text-sm">Waiting for signal...</span>}
          {decodedChars.map((char, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="font-bold text-black mb-1">{char}</span>
              <span className="text-blue-600 font-bold text-2xl" style={{fontFamily: 'sans-serif'}}>{LATIN_TO_ARABIC[char]}</span>
            </div>
          ))}
        </div>
        <div className="p-2 bg-gray-200 border-t border-gray-300">
          <button onClick={() => setDecodedChars([])} className="px-2 py-0.5 border border-gray-400 rounded-sm text-xs text-black bg-gray-100 hover:bg-white shadow-sm">Clear message</button>
        </div>
      </div>

      {/* Graph Block */}
      <div className="bg-[#f0f9ff] p-0 border-t border-red-200 mt-4 relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={200}
          className="w-full h-48 bg-[#0f172a]"
        />
      </div>
    </div>
  );
};

export default DecoderTab;