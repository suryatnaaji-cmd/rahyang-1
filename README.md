import React, { useState } from 'react';
import TTSGenerator from './components/TTSGenerator';
import ImageGenerator from './components/ImageGenerator';
import VeoPromptCrafter from './components/VeoPromptCrafter';
import GoogleFlowPanel from './components/GoogleFlowPanel';

type Page = 'ttsGenerator' | 'imageGenerator' | 'veoCrafter' | 'googleFlow';

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('ttsGenerator');

    const NavButton: React.FC<{ targetPage: Page; children: React.ReactNode }> = ({ targetPage, children }) => (
        <button
            onClick={() => setPage(targetPage)}
            className={`py-2 px-4 rounded-lg text-sm sm:text-base font-semibold transition duration-300
                ${page === targetPage
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30'
                    : 'bg-gray-200/80 text-gray-600 hover:bg-gray-300'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans p-4 sm:p-8">
            <header className="text-center mb-10 pb-4 border-b-2 border-transparent relative">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-purple-600 transition duration-500">
                    RAHYANG IMAGES GENERATOR V4.6
                </h1>
                <p className="mt-2 text-xl text-gray-600">
                    Ngonten Jadi Mudah: Gabungkan Produk, Model, dan Konsep Foto dalam Sekali Klik
                </p>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse-slow"></div>
            </header>

            <nav className="flex justify-center flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-200">
                <NavButton targetPage="ttsGenerator">Text To Voice</NavButton>
                <NavButton targetPage="imageGenerator">Images Generator</NavButton>
                <NavButton targetPage="veoCrafter">Veo 3 Prompt Crafter</NavButton>
                <NavButton targetPage="googleFlow">Google Labs Flow</NavButton>
            </nav>

            <div style={{ display: page === 'ttsGenerator' ? 'block' : 'none' }}>
                <TTSGenerator />
            </div>
            <div style={{ display: page === 'imageGenerator' ? 'block' : 'none' }}>
                <ImageGenerator />
            </div>
            <div style={{ display: page === 'veoCrafter' ? 'block' : 'none' }}>
                <VeoPromptCrafter />
            </div>
            <div style={{ display: page === 'googleFlow' ? 'block' : 'none' }}>
                <GoogleFlowPanel />
            </div>
        </div>
    );
};

export default App;
