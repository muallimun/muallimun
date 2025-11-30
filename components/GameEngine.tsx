import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameTheme, GameObjectEntity, GameStats, GameLevel, LetterData } from '../types';
import { ARABIC_LETTERS_DATA } from '../data';
import { audioManager } from '../services/audioManager';
import GameObject from './GameObject';
import { Heart, Pause, Play, LogOut, Hand } from 'lucide-react';

// Custom Basket SVG Component
const CustomBasketIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="50" cy="35" rx="40" ry="10" fill="#5D4037" />
    <path d="M10 35 L20 85 Q50 95 80 85 L90 35 Z" fill="#795548" stroke="#3E2723" strokeWidth="2" />
    <ellipse cx="50" cy="35" rx="40" ry="10" fill="#8D6E63" stroke="#3E2723" strokeWidth="2" />
    <path d="M20 50 Q50 60 80 50" stroke="#3E2723" strokeWidth="1" strokeOpacity="0.5" fill="none"/>
    <path d="M25 65 Q50 75 75 65" stroke="#3E2723" strokeWidth="1" strokeOpacity="0.5" fill="none"/>
    <path d="M30 40 L35 80" stroke="#3E2723" strokeWidth="1" strokeOpacity="0.5" fill="none"/>
    <path d="M50 40 L50 85" stroke="#3E2723" strokeWidth="1" strokeOpacity="0.5" fill="none"/>
    <path d="M70 40 L65 80" stroke="#3E2723" strokeWidth="1" strokeOpacity="0.5" fill="none"/>
    <rect x="35" y="55" width="30" height="15" rx="4" fill="#FFF8E1" stroke="#3E2723" strokeWidth="1" />
  </svg>
);

// Floating Text Component
const FloatingText = ({ x, y, text }: { x: number, y: number, text: string }) => (
    <div 
        className="absolute animate-float-out z-[60] pointer-events-none text-red-500 font-black text-2xl drop-shadow-md"
        style={{ left: x, top: y, fontFamily: 'Baloo Bhaijaan 2' }}
    >
        {text}
    </div>
);

interface GameEngineProps {
  theme: GameTheme;
  level: GameLevel;
  onGameOver: (stats: GameStats) => void;
  onExit: () => void;
}

const WAVE_DURATION = 12; 
const SPAWN_INTERVAL_MS = 1000;
const MAX_FOREST_OBJECTS = 14; 
const IDLE_TIMEOUT_MS = 40000; 
const MAX_SCREEN_OBJECTS = 15; 

const RANDOM_COLORS = [
  'text-red-500 fill-red-200',
  'text-orange-500 fill-orange-200',
  'text-yellow-500 fill-yellow-200',
  'text-teal-500 fill-teal-200',
  'text-pink-500 fill-pink-200',
  'text-purple-500 fill-purple-200',
  'text-blue-500 fill-blue-200'
];

const GameEngine: React.FC<GameEngineProps> = ({ theme, level, onGameOver, onExit }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targetLetterData, setTargetLetterData] = useState<LetterData | null>(null);
  const [targetDisplayForm, setTargetDisplayForm] = useState<string>(''); 
  const [timeLeft, setTimeLeft] = useState(WAVE_DURATION);
  const [objects, setObjects] = useState<GameObjectEntity[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [particles, setParticles] = useState<{id: number, x: number, y: number, color: string}[]>([]);
  const [wrongMarks, setWrongMarks] = useState<{id: number, x: number, y: number}[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<{id: number, x: number, y: number, text: string}[]>([]);
  const [showDragHint, setShowDragHint] = useState(false);
  
  const mistakesRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<any>(null);
  const spawnerRef = useRef<any>(null);
  const idleTimerRef = useRef<any>(null);
  const waveRef = useRef<number>(1);
  const basketRef = useRef<HTMLDivElement>(null);
  const spawnBagRef = useRef<boolean[]>([]);
  const laneCooldownsRef = useRef<Record<number, number>>({}); 

  const calculateStars = (finalScore: number) => {
      if (finalScore >= 120) return 3;
      if (finalScore >= 50) return 2;
      return 1;
  };

  const clearIntervals = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnerRef.current) clearInterval(spawnerRef.current);
  };

  const triggerGameOver = (finalScore: number, finalLives: number) => {
      clearIntervals();
      audioManager.playSFX('gameover');
      onGameOver({
          score: finalScore,
          lives: finalLives,
          wave: waveRef.current,
          mistakes: Array.from(mistakesRef.current),
          level,
          stars: calculateStars(finalScore)
      });
  };

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
        triggerGameOver(score, 0);
    }, IDLE_TIMEOUT_MS);
  };

  useEffect(() => {
      if (theme.id === 'forest') {
          setShowDragHint(true);
          const t = setTimeout(() => setShowDragHint(false), 4000);
          return () => clearTimeout(t);
      } else {
          setShowDragHint(false);
      }
  }, [theme.id]);

  const spawnParticles = (x: number, y: number) => {
      const colors = ['#f43f5e', '#fbbf24', '#34d399', '#60a5fa'];
      const newParticles = Array.from({ length: 12 }).map((_, i) => ({
          id: Date.now() + i,
          x,
          y,
          color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id < Date.now()));
      }, 1000);
  };

  const spawnWrongMark = (x: number, y: number) => {
      const id = Date.now();
      setWrongMarks(prev => [...prev, { id, x, y }]);
      setFloatingTexts(prev => [...prev, { id, x, y, text: '-5' }]);
      
      setTimeout(() => {
          setWrongMarks(prev => prev.filter(w => w.id !== id));
          setFloatingTexts(prev => prev.filter(t => t.id !== id));
      }, 1500);
  };

  useEffect(() => {
    const handleUserActivity = () => {
        if (!isPaused) resetIdleTimer();
    };
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    resetIdleTimer();
    return () => {
        window.removeEventListener('mousedown', handleUserActivity);
        window.removeEventListener('touchstart', handleUserActivity);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPaused, score, lives]);

  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.hidden) setIsPaused(true);
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const getRandomForm = (letterData: LetterData): string => {
    if (level === 1) return letterData.isolated;
    const forms = [letterData.initial, letterData.medial, letterData.final];
    return forms[Math.floor(Math.random() * forms.length)];
  };

  const getNextSpawnType = (): boolean => {
    if (spawnBagRef.current.length === 0) {
      const newBag = [true, true, true, false, false, false, false, false, false, false];
      for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
      }
      spawnBagRef.current = newBag;
    }
    return spawnBagRef.current.pop() || false;
  };

  const createForestObject = (targetData: LetterData, targetForm: string, existingObjects: GameObjectEntity[]): GameObjectEntity | null => {
        let startX = 0;
        let startY = 0;
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 50) {
             attempts++;
             const testX = Math.random() * 76 + 12; 
             const testY = Math.random() * 50 + 15;

             const inLeftExt = Math.pow((testX - 15) * 1.8, 2) + Math.pow((testY - 55) * 1.2, 2) < 1100;
             const inLeft = Math.pow((testX - 30) * 1.6, 2) + Math.pow((testY - 45) * 1.2, 2) < 1300; 
             const inRightExt = Math.pow((testX - 85) * 1.8, 2) + Math.pow((testY - 55) * 1.2, 2) < 1100;
             const inRight = Math.pow((testX - 70) * 1.6, 2) + Math.pow((testY - 45) * 1.2, 2) < 1300;
             const inTop = Math.pow((testX - 50) * 1.4, 2) + Math.pow((testY - 30) * 1.2, 2) < 1500;

             if (!inLeft && !inRight && !inTop && !inLeftExt && !inRightExt) continue;

             let tooClose = false;
             for (const obj of existingObjects) {
                 const dx = (obj.startX - testX) * 1.6;
                 const dy = (obj.startY! - testY);
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 if (dist < 12) { 
                     tooClose = true;
                     break;
                 }
             }

             if (!tooClose) {
                 startX = testX;
                 startY = testY;
                 validPosition = true;
             }
        }

        if (!validPosition) return null; 

        const id = Date.now().toString() + Math.random().toString();
        const hasTarget = existingObjects.some(o => o.originalLetterId === targetData.id);
        const count = existingObjects.length;
        let isTarget = false;
        
        if (!hasTarget && count === 0) isTarget = true;
        else if (!hasTarget && count >= MAX_FOREST_OBJECTS - 2) isTarget = true;
        else isTarget = getNextSpawnType();
        
        let letterData = targetData;
        let displayStr = targetForm;

        if (!isTarget) {
          const useTrickyDistractor = level === 2 && Math.random() < 0.5;

          if (useTrickyDistractor) {
             letterData = targetData;
             const allForms = [letterData.isolated, letterData.initial, letterData.medial, letterData.final];
             const wrongForms = allForms.filter(f => f !== targetForm);
             if (wrongForms.length > 0) {
                 displayStr = wrongForms[Math.floor(Math.random() * wrongForms.length)];
             } else {
                 displayStr = getRandomForm(letterData);
             }
          } else {
             do {
                letterData = ARABIC_LETTERS_DATA[Math.floor(Math.random() * ARABIC_LETTERS_DATA.length)];
             } while (letterData.id === targetData.id);
             displayStr = getRandomForm(letterData);
          }
        } else {
           displayStr = targetForm; 
        }

        const isBonus = Math.random() < 0.15;

        return {
          id,
          letter: displayStr,
          originalLetterId: letterData.id,
          isTarget,
          isBonus: isTarget && isBonus, 
          startX,
          startY,
          duration: 0, 
          delay: 0,
          spawnTime: Date.now()
        };
  }

  const reshuffleForest = (tgtData: LetterData, tgtForm: string) => {
     const newObjects: GameObjectEntity[] = [];
     spawnBagRef.current = [];
     for(let i=0; i < MAX_FOREST_OBJECTS; i++) {
         const newObj = createForestObject(tgtData, tgtForm, newObjects);
         if (newObj) newObjects.push(newObj);
     }
     setObjects(newObjects);
  };

  const fillForestTree = (currentTarget: LetterData, currentTargetForm: string) => {
     setObjects(prev => {
        if (prev.length >= MAX_FOREST_OBJECTS) return prev; 
        const newObj = createForestObject(currentTarget, currentTargetForm, prev);
        return newObj ? [...prev, newObj] : prev;
     });
  };

  const spawnObject = (currentTarget: LetterData, currentTargetForm: string) => {
    if (isPaused) return;

    setObjects(prevObjects => {
        if (prevObjects.length >= MAX_SCREEN_OBJECTS) {
            return prevObjects;
        }

        const id = Date.now().toString() + Math.random().toString();
        const isTarget = getNextSpawnType();
        
        let letterData = currentTarget;
        let displayStr = currentTargetForm;

        if (!isTarget) {
          const useTrickyDistractor = level === 2 && Math.random() < 0.5;

          if (useTrickyDistractor) {
             letterData = currentTarget;
             const allForms = [letterData.isolated, letterData.initial, letterData.medial, letterData.final];
             const wrongForms = allForms.filter(f => f !== currentTargetForm);
             if (wrongForms.length > 0) {
                 displayStr = wrongForms[Math.floor(Math.random() * wrongForms.length)];
             } else {
                 displayStr = getRandomForm(letterData);
             }
          } else {
             do {
                letterData = ARABIC_LETTERS_DATA[Math.floor(Math.random() * ARABIC_LETTERS_DATA.length)];
             } while (letterData.id === currentTarget.id);
             displayStr = getRandomForm(letterData);
          }
        } else {
          displayStr = currentTargetForm;
        }

        let lane = 0;
        let startX = 0;
        
        if (theme.id === 'sea') {
            const now = Date.now();
            const availableLanes = [];
            for(let i=1; i<=6; i++) {
                if (!laneCooldownsRef.current[i] || now > laneCooldownsRef.current[i]) {
                    availableLanes.push(i);
                }
            }
            
            if (availableLanes.length === 0) {
                return prevObjects;
            }
            
            lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            laneCooldownsRef.current[lane] = now + 2500; 
            startX = 100; 
        } else {
            startX = Math.random() * 70 + 10;
        }
        
        let duration = 5;
        if (theme.id === 'sea') {
          duration = Math.random() * 5 + 9;
        } else {
          duration = Math.random() * 5 + 8;
        }

        const isBonus = Math.random() < 0.15;

        const newObj: GameObjectEntity = {
          id,
          letter: displayStr,
          originalLetterId: letterData.id,
          isTarget,
          isBonus: isTarget && isBonus,
          startX: startX,
          duration: duration, 
          delay: 0,
          lane: lane,
          color: RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)],
          spawnTime: Date.now()
        };

        return [...prevObjects, newObj];
    });
  };

  const startNewWave = (isFirst = false) => {
    const nextLetter = ARABIC_LETTERS_DATA[Math.floor(Math.random() * ARABIC_LETTERS_DATA.length)];
    const nextForm = getRandomForm(nextLetter);

    setTargetLetterData(nextLetter);
    setTargetDisplayForm(nextForm);
    setTimeLeft(WAVE_DURATION);
    
    if (!isFirst) {
        waveRef.current += 1;
    } else {
        waveRef.current = 1;
    }

    setShowAnnouncement(true);
    setTimeout(() => setShowAnnouncement(false), 2000);
    
    if (nextLetter.audioUrl) {
         setTimeout(() => audioManager.playLetterSound(nextLetter.audioUrl), 500);
    }

    if (theme.id === 'forest') {
         reshuffleForest(nextLetter, nextForm);
    } else {
         setObjects([]);
    }
  };

  useEffect(() => {
    startNewWave(true);
    audioManager.playBGM(theme.id as any);
    return () => {
      audioManager.stopBGM();
      clearIntervals();
    };
  }, []);

  useEffect(() => {
    if (isPaused) {
      clearIntervals();
    } else {
      if (targetLetterData) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              startNewWave();
              return WAVE_DURATION;
            }
            return prev - 1;
          });
        }, 1000);
        
        spawnerRef.current = setInterval(() => {
             if (theme.id === 'forest') {
                fillForestTree(targetLetterData, targetDisplayForm);
             } else {
                spawnObject(targetLetterData, targetDisplayForm);
             }
        }, SPAWN_INTERVAL_MS);
      }
    }
    return () => clearIntervals();
  }, [isPaused, targetLetterData, targetDisplayForm]);

  const handleCorrect = (id: string, isBonus = false, clickX?: number, clickY?: number, spawnTime?: number) => {
      resetIdleTimer(); 
      setShowDragHint(false); 
      
      let points = isBonus ? 30 : 10;
      let feedbackText = '+10';
      if (isBonus) feedbackText = '+30';

      if (spawnTime) {
          const reactionTime = Date.now() - spawnTime;
          if (reactionTime < 2000) { 
              points += 5;
              feedbackText = isBonus ? 'ممتاز! +35' : 'سريع! +15';
          }
      }

      setScore((prev) => prev + points);
      if (isBonus) audioManager.playSFX('win');
      else audioManager.playThemeSFX('correct', theme.id);
      
      if (clickX && clickY) {
          spawnParticles(clickX, clickY);
          const floatId = Date.now() + Math.random();
          setFloatingTexts(prev => [...prev, { id: floatId, x: clickX, y: clickY, text: feedbackText }]);
          setTimeout(() => {
              setFloatingTexts(prev => prev.filter(t => t.id !== floatId));
          }, 1500);
      }
      setObjects((prev) => prev.filter(o => o.id !== id));
  };

  const handleWrong = (letterId: string, clickX?: number, clickY?: number) => {
      resetIdleTimer();
      setShowDragHint(false); 
      
      if (targetLetterData?.audioUrl) {
          audioManager.playLetterSound(targetLetterData.audioUrl);
      }

      if (clickX && clickY) spawnWrongMark(clickX, clickY);
      
      setScore(prev => Math.max(0, prev - 5));
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          triggerGameOver(score, 0); 
        } else {
          audioManager.playThemeSFX('wrong', theme.id);
        }
        return newLives;
      });
      if (targetLetterData) mistakesRef.current.add(targetLetterData.id);
  };

  const handleObjectClick = useCallback((id: string, _ignoredIsTarget: boolean, displayStr: string, x: number, y: number) => {
    if (isPaused || !targetLetterData) return;
    const obj = objects.find(o => o.id === id);
    if (!obj) return;
    
    let isActuallyTarget = false;
    if (level === 2) {
        isActuallyTarget = obj.letter === targetDisplayForm;
    } else {
        isActuallyTarget = obj.originalLetterId === targetLetterData.id;
    }

    if (isActuallyTarget) {
      handleCorrect(id, obj.isBonus, x, y, obj.spawnTime);
    } else {
      handleWrong(displayStr, x, y);
    }
  }, [isPaused, score, lives, theme.id, targetLetterData, objects, level, targetDisplayForm]);

  const handleObjectDrop = useCallback((id: string, x: number, y: number) => {
     if (isPaused || !basketRef.current || !targetLetterData) return;
     const basketRect = basketRef.current.getBoundingClientRect();
     const padding = 30; 
     const isInside = 
        x >= basketRect.left - padding && 
        x <= basketRect.right + padding &&
        y >= basketRect.top - padding && 
        y <= basketRect.bottom + padding;

     if (isInside) {
        const obj = objects.find(o => o.id === id);
        if (obj) {
            let isActuallyTarget = false;
            if (level === 2) {
                isActuallyTarget = obj.letter === targetDisplayForm;
            } else {
                isActuallyTarget = obj.originalLetterId === targetLetterData.id;
            }

            if (isActuallyTarget) {
                handleCorrect(id, obj.isBonus, x, y, obj.spawnTime);
            } else {
                handleWrong(obj.letter, x, y);
            }
        }
     }
  }, [isPaused, objects, theme.id, targetLetterData, lives, level, targetDisplayForm]);

  const handleAnimationEnd = useCallback((id: string) => {
    if (theme.id !== 'forest') {
       setObjects((prev) => prev.filter(obj => obj.id !== id));
    }
  }, [theme.id]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${theme.backgroundClass}`} dir="rtl">
      
      {showAnnouncement && targetLetterData && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none">
            <div className="animate-entrance bg-white rounded-[3rem] p-10 md:p-14 border-8 border-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.6)] flex flex-col items-center transform scale-125">
                <span className="text-9xl font-black text-indigo-600 mb-4 drop-shadow-md" style={{ fontFamily: 'Baloo Bhaijaan 2' }}>{targetDisplayForm}</span>
                <span className="text-3xl font-bold text-gray-500">ابحث عن هذا الحرف!</span>
            </div>
        </div>
      )}
      
      {particles.map(p => (
          <div key={p.id} className="particle" style={{ left: p.x, top: p.y, backgroundColor: p.color, '--tx': (Math.random() - 0.5) * 100 + 'px', '--ty': (Math.random() - 0.5) * 100 + 'px' } as any} />
      ))}
      {wrongMarks.map(w => (
          <div key={w.id} className="absolute animate-wrong z-[60] pointer-events-none text-red-600 drop-shadow-lg" style={{ left: w.x - 12, top: w.y - 12 }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          </div>
      ))}
      {floatingTexts.map(t => (
          <FloatingText key={t.id} x={t.x} y={t.y} text={t.text} />
      ))}

      {theme.id === 'forest' && (
        <div className="absolute bottom-0 left-0 w-full h-[85vh] z-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[18vh] h-[40%] bg-gradient-to-r from-[#3e2723] to-[#5d4037] z-0 rounded-t-lg shadow-2xl" />
          
          <div className="absolute bottom-[25%] left-1/2 transform -translate-x-1/2 w-[98vw] md:w-[95vw] h-[65%] z-10">
             <svg viewBox="0 0 1400 600" className="w-full h-full drop-shadow-2xl">
                <g fill="#1b5e20">
                   <circle cx="150" cy="400" r="180" />
                   <circle cx="350" cy="350" r="200" />
                   <circle cx="1250" cy="400" r="180" />
                   <circle cx="1050" cy="350" r="200" />
                   <circle cx="700" cy="300" r="250" />
                </g>
                <g fill="#2e7d32">
                   <circle cx="250" cy="300" r="160" />
                   <circle cx="1150" cy="300" r="160" />
                   <circle cx="500" cy="220" r="180" />
                   <circle cx="900" cy="220" r="180" />
                </g>
                <g fill="#43a047">
                   <circle cx="350" cy="250" r="150" />
                   <circle cx="1050" cy="250" r="150" />
                   <circle cx="700" cy="120" r="180" />
                   <circle cx="700" cy="300" r="180" />
                </g>
             </svg>
          </div>
          
          <div 
             ref={basketRef}
             className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center transition-transform hover:scale-105 pointer-events-auto"
          >
             <CustomBasketIcon size={120} className="drop-shadow-2xl" />
             <div className="bg-white/80 px-4 py-1 rounded-full text-base font-bold text-amber-900 mt-[-10px] shadow-sm backdrop-blur-sm border border-amber-900/20">اسحب هنا</div>
             
             {/* DRAG HINT ANIMATION */}
             {showDragHint && (
                 <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 animate-bounce">
                     <Hand size={40} className="text-white fill-white drop-shadow-lg" />
                 </div>
             )}
          </div>
        </div>
      )}

      {theme.id === 'sea' && (
        <div className="absolute inset-0 bg-blue-500/10 z-0 pointer-events-none" />
      )}

      {/* HUD - UPDATED FLEX LAYOUT */}
      <div className="absolute top-0 left-0 w-full p-2 z-50 flex flex-col pointer-events-none">
        
        {/* ROW 1: CONTROLS & SCORE */}
        <div className="flex justify-between items-center pointer-events-auto w-full px-2">
          {/* LEFT CONTROLS */}
          <div className="flex gap-2">
             <button 
              onClick={() => { audioManager.playUISFX('click'); onExit(); }}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 scale-90 md:scale-100"
            >
              <LogOut size={24} />
            </button>
            <button 
              onClick={() => { audioManager.playUISFX('click'); setIsPaused(!isPaused); }}
              className="bg-white/90 text-blue-800 p-2 rounded-full shadow-lg transition-transform hover:scale-105 scale-90 md:scale-100"
            >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
            </button>
            <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg font-bold text-blue-900 text-xl min-w-[80px] md:min-w-[100px] text-center scale-90 md:scale-100 origin-right" style={{fontFamily: 'Baloo Bhaijaan 2'}}>
              {score}
            </div>
          </div>

          {/* RIGHT STATS (LIVES & TIME) */}
          <div className="flex flex-col items-end gap-1 scale-90 md:scale-100 origin-left">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart 
                  key={i} 
                  className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-gray-400'}`} 
                />
              ))}
            </div>
            <div className={`bg-white/90 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 shadow-lg transition-colors ${timeLeft < 5 ? 'border-red-500 text-red-600 animate-pulse' : 'border-blue-300 text-gray-700'}`}>
               <span className="font-bold text-xl md:text-2xl">{timeLeft}</span>
            </div>
          </div>
        </div>

        {/* ROW 2: TARGET CARD (Centered & Lower) */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 pointer-events-auto">
             <div className="bg-yellow-400 border-4 border-white shadow-2xl rounded-2xl w-20 h-20 md:w-24 md:h-24 flex items-center justify-center animate-bounce-slow">
                <span className="text-4xl md:text-5xl font-black text-blue-900 pb-2" style={{ fontFamily: 'Baloo Bhaijaan 2' }}>
                  {targetDisplayForm}
                </span>
             </div>
             <div className="text-center mt-1 bg-black/30 rounded-full px-2 text-white font-bold text-xs md:text-sm shadow-md">
                الهدف
             </div>
        </div>

      </div>

      {isPaused && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="text-white text-4xl font-bold bg-blue-600 px-8 py-4 rounded-xl shadow-2xl">
            توقف مؤقت
          </div>
        </div>
      )}

      <div className={`relative w-full h-full z-10 ${theme.id === 'sea' ? 'cursor-crosshair' : ''}`}>
        {objects.map((obj) => (
          <GameObject 
            key={obj.id} 
            entity={obj} 
            theme={theme} 
            onClick={handleObjectClick}
            onDrop={handleObjectDrop}
            onAnimationEnd={handleAnimationEnd}
          />
        ))}
      </div>
    </div>
  );
};

export default GameEngine;