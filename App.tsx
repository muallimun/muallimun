
import React, { useState, useEffect } from 'react';
import { GameStateStatus, GameTheme, ThemeType, GameStats, GameLevel } from './types';
import GameEngine from './components/GameEngine';
import { audioManager } from './services/audioManager';
import { RotateCcw, LogOut, Star, LayoutGrid, Fish, Apple, Cloud, Play } from 'lucide-react';

const THEMES: GameTheme[] = [
  { id: 'sea', name: 'البحر', backgroundClass: 'bg-gradient-to-b from-cyan-300 to-blue-600', objectIcon: 'fish', primaryColor: 'blue' },
  { id: 'forest', name: 'الغابة', backgroundClass: 'bg-gradient-to-b from-sky-300 to-green-600', objectIcon: 'apple', primaryColor: 'green' },
  { id: 'sky', name: 'السماء', backgroundClass: 'bg-gradient-to-b from-blue-300 to-white', objectIcon: 'balloon', primaryColor: 'sky' },
];

function App() {
  const [gameState, setGameState] = useState<GameStateStatus>('menu');
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeType | null>(null); 
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(1);
  const [lastStats, setLastStats] = useState<GameStats | null>(null);

  useEffect(() => {
     const loader = document.getElementById('loading-screen');
     if(loader) {
         loader.style.opacity = '0';
         setTimeout(() => loader.remove(), 500);
     }
  }, []);

  const playHover = () => audioManager.playUISFX('hover');
  const playClick = () => audioManager.playUISFX('click');

  const handleThemeSelect = (id: ThemeType) => {
    playClick();
    setSelectedThemeId(id);
  };

  const handleStartGame = () => {
    if (!selectedThemeId) return;
    playClick();
    setGameState('playing');
  };

  const getActiveTheme = (): GameTheme => {
     if (selectedThemeId === 'random') {
        const available = THEMES;
        return available[Math.floor(Math.random() * available.length)];
     }
     return THEMES.find(t => t.id === selectedThemeId) || THEMES[0];
  };

  const handleGameOver = (stats: GameStats) => {
    setLastStats(stats);
    setGameState('gameover');
  };

  const exitGame = () => {
    playClick();
    audioManager.stopBGM();
    setGameState('menu');
    setSelectedThemeId(null);
  };

  /* --- MENU SCREEN --- */
  if (gameState === 'menu') {
    return (
      <div className="fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden" dir="rtl" style={{backgroundColor: '#f8fafc'}}>
        
        {/* 1. SCROLLABLE CONTENT AREA (Flex-1) */}
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center py-6 px-4">
            
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
               <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-200 rounded-full blur-[100px] opacity-40"></div>
               <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-yellow-200 rounded-full blur-[100px] opacity-40"></div>
            </div>

            <div className="relative z-10 glass-panel rounded-[3rem] p-6 md:p-8 shadow-2xl w-full max-w-4xl text-center border border-white/60 mt-2 mb-4 shrink-0 bg-white/85">
            
            <div className="mb-4">
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow-sm mb-2" style={{ fontFamily: 'Baloo Bhaijaan 2' }}>
                مغامرة الحروف
                </h1>
                <p className="text-lg md:text-xl font-bold tracking-wide text-slate-500">تعلم الحروف العربية بطريقة ممتعة وتفاعلية</p>
            </div>

            {/* BUTTONS REMOVED AS REQUESTED */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 mt-8 md:mt-4">
                {/* LEVEL SELECTION */}
                <div className="glass-panel rounded-3xl p-3 md:p-6 shadow-sm bg-white/50 border-indigo-50">
                    <div className="flex items-center gap-2 mb-2 md:mb-4 justify-center text-indigo-600">
                    <Star className="fill-yellow-400 text-yellow-500" />
                    <h3 className="text-lg md:text-2xl font-bold text-slate-800">المستوى</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 md:gap-4 h-full">
                    <button 
                        onClick={() => { playClick(); setSelectedLevel(1); }}
                        onMouseEnter={playHover}
                        className={`p-2 md:p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 ${selectedLevel === 1 ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:bg-indigo-50 hover:border-indigo-200'}`}
                    >
                        <span className="text-2xl md:text-4xl font-black">أ</span>
                        <span className="font-bold text-[10px] md:text-sm">الحروف المنفصلة</span>
                    </button>

                    <button 
                        onClick={() => { playClick(); setSelectedLevel(2); }}
                        onMouseEnter={playHover}
                        className={`p-2 md:p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 ${selectedLevel === 2 ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:bg-purple-50 hover:border-purple-200'}`}
                    >
                        <span className="text-2xl md:text-4xl font-black">ـبـ</span>
                        <span className="font-bold text-[10px] md:text-sm">أشكال الحروف</span>
                    </button>
                    </div>
                </div>

                {/* THEME SELECTION */}
                <div className="glass-panel rounded-3xl p-3 md:p-6 shadow-sm bg-white/50 border-indigo-50">
                    <div className="flex items-center gap-2 mb-2 md:mb-4 justify-center text-indigo-600">
                    <LayoutGrid className="text-indigo-600" />
                    <h3 className="text-lg md:text-2xl font-bold text-slate-800">العالم</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {THEMES.map(t => {
                        const Icon = t.id === 'sea' ? Fish : t.id === 'forest' ? Apple : Cloud;
                        const isSelected = selectedThemeId === t.id;
                        
                        let activeClass = '';
                        if (t.id === 'sea') activeClass = 'bg-gradient-to-br from-cyan-400 to-blue-600 border-blue-600 shadow-cyan-200';
                        if (t.id === 'forest') activeClass = 'bg-gradient-to-br from-emerald-400 to-green-600 border-green-600 shadow-green-200';
                        if (t.id === 'sky') activeClass = 'bg-gradient-to-br from-sky-400 to-indigo-500 border-indigo-600 shadow-sky-200';

                        return (
                        <button
                            key={t.id}
                            onClick={() => handleThemeSelect(t.id)}
                            onMouseEnter={playHover}
                            className={`relative p-1.5 md:p-3 rounded-2xl border-2 transition-all group overflow-hidden flex flex-col items-center justify-center min-h-[60px] md:min-h-[90px]
                            ${isSelected 
                                ? `${activeClass} text-white scale-105 shadow-xl` 
                                : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-gray-200'}
                            `}
                        >
                            <div className="mb-0.5">
                              <Icon className={`w-5 h-5 md:w-8 md:h-8 drop-shadow-sm ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-gray-500 transition-colors'}`} />
                            </div>
                            <span className="block font-bold text-[10px] md:text-base">
                              {t.name}
                            </span>
                        </button>
                        );
                    })}
                    <button
                        onClick={() => handleThemeSelect('random')}
                        onMouseEnter={playHover}
                        className={`relative p-1.5 md:p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center min-h-[60px] md:min-h-[90px]
                            ${selectedThemeId === 'random' 
                                ? 'bg-gradient-to-br from-orange-400 to-red-500 border-orange-600 text-white scale-105 shadow-xl shadow-orange-200' 
                                : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-gray-200'}
                        `}
                        >
                        <div className={`w-5 h-5 md:w-8 md:h-8 mb-0.5 flex items-center justify-center text-lg md:text-2xl font-black ${selectedThemeId === 'random' ? 'text-white' : 'text-gray-400'}`}>?</div>
                        <span className="block font-bold text-[10px] md:text-base">عشوائي</span>
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>

        {/* 2. STATIC FOOTER (Shrink-0) - ALWAYS VISIBLE, NEVER OVERLAPPING */}
        <div className="w-full p-4 glass-panel border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-50 shrink-0 bg-white/90 backdrop-blur-md">
            <button
                onClick={handleStartGame}
                disabled={!selectedThemeId}
                onMouseEnter={playHover}
                className={`w-full py-4 md:py-5 rounded-2xl font-black text-2xl md:text-3xl shadow-xl transition-all transform flex items-center justify-center gap-3 relative overflow-hidden group
                    ${selectedThemeId 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-green-200 cursor-pointer' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                `}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                <Play className="w-8 h-8 md:w-9 md:h-9 relative z-10" fill="currentColor" />
                <span className="relative z-10">{selectedThemeId ? 'ابدأ المغامرة' : 'اختر عالماً للبدء'}</span>
            </button>
        </div>

      </div>
    );
  }

  /* --- GAME OVER --- */
  if (gameState === 'gameover' && lastStats) {
    const stars = lastStats.stars || 1; 

    return (
      <div className="fixed inset-0 w-full h-[100dvh] bg-slate-900 overflow-hidden flex flex-col" dir="rtl">
         <div className="flex-1 w-full overflow-y-auto flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl w-full max-w-md text-center animate-bounce-slow relative overflow-hidden border-8 border-white/10 ring-4 ring-white/50 my-auto shrink-0">
                <div className={`absolute top-0 left-0 w-full h-4 ${lastStats.score > 50 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                
                <div className="mb-4 flex justify-center mt-2">
                   {/* STAR RATING DISPLAY */}
                   <div className="flex gap-2">
                       {[1, 2, 3].map(s => (
                           <Star 
                             key={s} 
                             size={48} 
                             className={`transform transition-all duration-500 ${s <= stars ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-lg' : 'text-gray-200 fill-gray-100'}`} 
                           />
                       ))}
                   </div>
                </div>

                <h2 className="text-5xl font-black text-gray-800 mb-2">
                {stars === 3 ? 'ممتاز!' : stars === 2 ? 'عمل رائع!' : 'حاول مرة أخرى'}
                </h2>
                
                <div className="flex flex-col gap-4 mb-8 mt-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center shadow-inner">
                    <span className="text-slate-400 text-sm font-bold tracking-wider mb-1">النتيجة النهائية</span>
                    <div className="text-7xl font-black text-slate-700 drop-shadow-sm">{lastStats.score}</div>
                </div>

                {lastStats.mistakes.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                        <span className="text-red-400 text-sm font-bold tracking-wider">حروف تحتاج لمراجعة</span>
                        <div className="flex flex-wrap gap-2 justify-center mt-3">
                        {lastStats.mistakes.slice(0, 5).map((m, i) => (
                            <span key={i} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-red-100 text-red-600 font-black text-2xl">{m}</span>
                        ))}
                        {lastStats.mistakes.length > 5 && <span className="text-gray-400 text-xs self-center">...</span>}
                        </div>
                    </div>
                )}
                </div>

                <div className="flex gap-4 justify-center">
                <button 
                    onClick={exitGame}
                    onMouseEnter={playHover}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut size={22} /> القائمة
                </button>
                <button 
                    onClick={() => setGameState('playing')}
                    onMouseEnter={playHover}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    <RotateCcw size={22} /> العب مجدداً
                </button>
                </div>
            </div>
         </div>
      </div>
    );
  }

  const activeTheme = getActiveTheme();

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-slate-50">
      <GameEngine 
        theme={activeTheme} 
        level={selectedLevel}
        onGameOver={handleGameOver} 
        onExit={exitGame}
      />
    </div>
  );
}

export default App;
