import PropTypes from 'prop-types';
import { audioHandler } from '../utils/AudioHandler';
import { LATIN_TO_ARABIC, MORSE_CODE_MAP } from '../utils/morseConstants';

// Pronunciation guide based on standard NATO or user image if visible.
// From image 4: E->ECHO, I->INDIA, S->SIERRA, H->HOTEL, T->TANGO etc.
const PRONUNCIATION = {
  'E': 'ECHO', 'I': 'INDIA', 'S': 'SIERRA', 'H': 'HOTEL',
  'T': 'TANGO', 'M': 'MIKE', 'O': 'OSCAR', 'A': 'ALPHA',
  'U': 'UNIFORM', 'V': 'VICTOR', 'N': 'NOVEMBER', 'D': 'DELTA',
  'B': 'BRAVO', 'W': 'WHISKEY', 'J': 'JULIETT', 'G': 'GOLF',
  'Z': 'ZULU', 'C': 'CHARLIE', 'L': 'LIMA', 'F': 'FOXTROT',
  'Y': 'YANKEE', 'Q': 'QUEBEC', 'K': 'KILO', 'R': 'ROMEO',
  'X': 'X-RAY', 'P': 'PAPA',
  '0': 'ZERO', '1': 'UN', '2': 'DEUX', '3': 'TROIS', '4': 'QUATRE',
  '5': 'CIN QUE', '6': 'SI SSSE', '7': 'SE TE', '8': 'HUI TE', '9': 'NEU FE'
};

// Visual representation of morse code
const MorseVisual = ({ code }) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {code.split('').map((symbol, idx) => (
        symbol === '.' ? (
          <div 
            key={idx} 
            className="w-2 h-2 bg-blue-600 rounded-full"
            title="Dit"
          />
        ) : (
          <div 
            key={idx} 
            className="w-6 h-2 bg-blue-600 rounded-sm"
            title="Dah"
          />
        )
      ))}
    </div>
  );
};

MorseVisual.propTypes = {
  code: PropTypes.string.isRequired,
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
      className="hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-200 group"
      onClick={() => handlePlay(MORSE_CODE_MAP[char])}
    >
      <td className="p-3 text-center text-xl font-arabic">{LATIN_TO_ARABIC[char] || '-'}</td>
      <td className="p-3 text-center font-bold text-lg">{char}</td>
      <td className="p-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <MorseVisual code={MORSE_CODE_MAP[char]} />
          <span className="font-mono text-blue-600 text-xs opacity-70 group-hover:opacity-100">
            {MORSE_CODE_MAP[char]}
          </span>
        </div>
      </td>
      <td className="p-3 text-center text-gray-600 text-sm">
        {PRONUNCIATION[char] || ''}
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-4 text-center">
        <h2 className="text-xl font-bold uppercase tracking-wider">Lecture Au Son Language Français</h2>
        <p className="text-sm mt-1 text-gray-300">Click any row to hear the Morse code</p>
      </div>
      
      <div className="p-6 overflow-x-auto">
        {/* Legend */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Visual Guide:</h3>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Dit (·) = Short pulse</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-2 bg-blue-600 rounded-sm"></div>
              <span className="text-gray-600">Dah (−) = Long pulse</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Letters Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
                <th className="p-3 text-center font-semibold text-gray-700">Arabic</th>
                <th className="p-3 text-center font-semibold text-gray-700">Letter</th>
                <th className="p-3 text-center font-semibold text-gray-700">Morse Code</th>
                <th className="p-3 text-center font-semibold text-gray-700">Pronunciation</th>
              </tr>
            </thead>
            <tbody>
              {letters.map(renderRow)}
            </tbody>
          </table>

          {/* Numbers Table */}
           <table className="w-full text-left border-collapse h-fit">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
                <th className="p-3 text-center font-semibold text-gray-700">Arabic</th>
                <th className="p-3 text-center font-semibold text-gray-700">Digit</th>
                <th className="p-3 text-center font-semibold text-gray-700">Morse Code</th>
                <th className="p-3 text-center font-semibold text-gray-700">Pronunciation</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map(renderRow)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReferenceTab;
