import React from 'react';
import { audioHandler } from '../utils/AudioHandler';
import { LATIN_TO_ARABIC, MORSE_CODE_MAP } from '../utils/morseConstants';

// Pronunciation guide based on standard NATO or user image if visible.
// From image 4: E->ECHO, I->INDIA, S->SIERRA, H->HOTEL, T->TANGO etc.
const PRONUNCIATION = {
  'E': 'ECHO', 'I': 'INDIA', 'S': 'SIERRA', 'H': 'HOTEL',
  'T': 'TANGO', 'M': 'MIKE', 'O': 'OSCAR', 'A': 'ALPHA',
  'U': 'UNIFORM', 'V': 'VICTOR', 'N': 'NOVEMBER', 'D': 'DELTA',
  'B': 'BRAVO', 'W': 'WHISKEY', 'J': 'JULIETT', 'G': 'GOLF',
  'Z': 'ZULU', 'C': 'CHARLIE', 'L': 'LIMA', 'F': 'FOX-TROTT',
  'Y': 'YANKEE', 'Q': 'QUEBEC', 'K': 'KILO', 'R': 'ROMEO',
  'X': 'X-RAY', 'P': 'PAPA',
  '0': 'ZERO', '1': 'UN', '2': 'DEUX', '3': 'TROIS', '4': 'QUATRE',
  '5': 'CIN QUE', '6': 'SI SSSE', '7': 'SE TE', '8': 'HUI TE', '9': 'NEU FE'
};

const ReferenceTab = () => {
  const letters = Object.keys(MORSE_CODE_MAP).filter(k => isNaN(k)); // text letters
  const numbers = Object.keys(MORSE_CODE_MAP).filter(k => !isNaN(k)); // numbers

  const handlePlay = (code) => {
    audioHandler.playMorseSequence(code);
  };

  const renderRow = (char) => (
    <tr 
      key={char} 
      className="hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-200"
      onClick={() => handlePlay(MORSE_CODE_MAP[char])}
    >
      <td className="p-3 text-center text-xl font-arabic">{LATIN_TO_ARABIC[char] || '-'}</td>
      <td className="p-3 text-center font-bold">{char}</td>
      <td className="p-3 text-center font-mono text-blue-600 font-bold tracking-widest">
        {MORSE_CODE_MAP[char]}
      </td>
      <td className="p-3 text-center text-gray-600 text-sm">
        {PRONUNCIATION[char] || ''}
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-gray-800 text-white p-4 text-center">
        <h2 className="text-xl font-bold uppercase tracking-wider">Lecture Au Son Language Français</h2>
      </div>
      
      <div className="p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Letters Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="p-3 text-center font-semibold text-gray-700">Arabic</th>
                <th className="p-3 text-center font-semibold text-gray-700">Letter</th>
                <th className="p-3 text-center font-semibold text-gray-700">Code</th>
                <th className="p-3 text-center font-semibold text-gray-700">Pronunciation</th>
              </tr>
            </thead>
            <tbody>
              {letters.map(renderRow)}
            </tbody>
          </table>

          {/* Numbers Table (or continuation) */}
           <table className="w-full text-left border-collapse h-fit">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="p-3 text-center font-semibold text-gray-700">Arabic</th>
                <th className="p-3 text-center font-semibold text-gray-700">Digit</th>
                <th className="p-3 text-center font-semibold text-gray-700">Code</th>
                <th className="p-3 text-center font-semibold text-gray-700">Pronunciation</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map(renderRow)}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 text-center text-sm text-gray-500">
        Click any row to hear the Morse code
      </div>
    </div>
  );
};

export default ReferenceTab;
