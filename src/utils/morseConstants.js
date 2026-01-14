export const LATIN_TO_ARABIC = {
  'E': '\u0621', // ء
  'I': '\u064A', // ي
  'S': '\u0633', // س
  'H': '\u062D', // ح
  'T': '\u062A', // ت
  'M': '\u0645', // م
  'O': '\u062E', // خ
  'A': '\u0627', // ا
  'U': '\u0637', // ط
  'V': '\u0636', // ض
  'N': '\u0646', // ن
  'D': '\u062F', // د
  'B': '\u0628', // ب
  'W': '\u0648', // و
  'J': '\u062C', // ج
  'G': '\u063A', // غ
  'Z': '\u0630', // ذ
  'C': '\u062B', // ث
  'L': '\u0644', // ل
  'F': '\u0641', // ف
  'Y': '\u0638', // ظ
  'Q': '\u0642', // ق
  'K': '\u0643', // ك
  'R': '\u0631', // ر
  'X': '\u0635', // ص
  'P': '\u0639', // ع
  '0': '\u0660', // ٠
  '1': '\u0661', // ١
  '2': '\u0662', // ٢
  '3': '\u0663', // ٣
  '4': '\u0664', // ٤
  '5': '\u0665', // ٥
  '6': '\u0666', // ٦
  '7': '\u0667', // ٧
  '8': '\u0668', // ٨
  '9': '\u0669'  // ٩
};

export const MORSE_CODE_MAP = {
  'E': '.',
  'I': '..',
  'S': '...',
  'H': '....',
  'T': '-',
  'M': '--',
  'O': '---',
  'A': '.-',
  'U': '..-',
  'V': '...-',
  'N': '-.',
  'D': '-..',
  'B': '-...',
  'W': '.--',
  'J': '.---',
  'G': '--.',
  'Z': '--..',
  'C': '-.-.',
  'L': '.-..',
  'F': '..-.',
  'Y': '-.--',
  'Q': '--.-',
  'K': '-.-',
  'R': '.-.',
  'X': '-..-',
  'P': '.--.',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.'
};

export const ARABIC_TO_LATIN = Object.fromEntries(
  Object.entries(LATIN_TO_ARABIC).map(([k, v]) => [v, k])
);

export const MORSE_TO_LATIN = Object.fromEntries(
  Object.entries(MORSE_CODE_MAP).map(([k, v]) => [v, k])
);

// Timing constants (in seconds, relative to a dot)
// Standard Morse: Dot=1, Dash=3, Intra-char=1, Inter-char=3, Word=7
export const DOT_DURATION_MS = 100; // Slower default speed (approx 12 WPM)

