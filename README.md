# Morse Code Learning Platform

A modern web application for learning and decoding Morse code, featuring audio analysis and visual representations.

## Features

- **Morse Code Decoder**: Upload audio files and decode Morse code in real-time
  - Automatic timing analysis for optimal decoding
  - Visual waveform display
  - Support for various audio formats
  - Arabic and Latin character mapping

- **Reference Tab**: Interactive Morse code reference guide
  - Visual representation of dots (dit) and dashes (dah)
  - Click to hear each character's Morse code
  - NATO phonetic pronunciation guide
  - Comprehensive letter and number support

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/chater-marzougui/MorseCode.git
cd MorseCode

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Deployment

This project is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Setup GitHub Pages Deployment

1. Go to your repository settings
2. Navigate to "Pages" in the sidebar
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Push to the `main` branch to trigger automatic deployment

The deployment workflow will:
- Install dependencies
- Run linter
- Build the project
- Deploy to GitHub Pages

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling
- **Web Audio API** - Audio processing and playback
- **Lucide React** - Icons

## Project Structure

```
MorseCode/
├── src/
│   ├── components/       # React components
│   │   ├── DecoderTab.jsx
│   │   └── ReferenceTab.jsx
│   ├── utils/           # Utility functions
│   │   ├── AudioHandler.js
│   │   └── morseConstants.js
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── .github/
│   └── workflows/       # GitHub Actions workflows
├── public/              # Static assets
└── dist/                # Build output
```

## Morse Code Decoding Algorithm

The decoder uses advanced audio analysis techniques:

1. **Timing Analysis**: Analyzes audio buffer to detect pulse and gap durations
2. **Median-based Clustering**: Separates dots from dashes using statistical analysis
3. **RMS Detection**: Uses Root Mean Square for accurate signal detection
4. **Adaptive Thresholds**: Automatically adjusts to different audio characteristics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
