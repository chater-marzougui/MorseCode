import React, { useState } from 'react';
import DecoderTab from './components/DecoderTab';
import ReferenceTab from './components/ReferenceTab';

function App() {
  const [activeTab, setActiveTab] = useState('decoder');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Morse Code Platform</h1>
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('decoder')}
              className={`px-4 py-2 rounded-md transition-colors font-medium text-sm ${
                activeTab === 'decoder'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Decoder
            </button>
            <button
              onClick={() => setActiveTab('reference')}
              className={`px-4 py-2 rounded-md transition-colors font-medium text-sm ${
                activeTab === 'reference'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Reference
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'decoder' ? <DecoderTab /> : <ReferenceTab />}
      </main>
    </div>
  );
}

export default App;
