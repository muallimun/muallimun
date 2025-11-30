import React, { useState, useEffect, useRef } from 'react';
import { GameTheme, GameObjectEntity } from '../types';
import { Apple, Fish } from 'lucide-react';

interface GameObjectProps {
  entity: GameObjectEntity;
  theme: GameTheme;
  onClick: (id: string, isTarget: boolean, letter: string, x: number, y: number) => void;
  onAnimationEnd: (id: string) => void;
  onDrop?: (id: string, x: number, y: number) => void;
}

const GameObject: React.FC<GameObjectProps> = ({ entity, theme, onClick, onAnimationEnd, onDrop }) => {
  const [clicked, setClicked] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const clickPosRef = useRef({ x: 0, y: 0 });

  let animationClass = '';
  let style: React.CSSProperties = {
    animationDuration: `${entity.duration}s`,
    animationDelay: '0s',
    touchAction: 'none'
  };

  if (isPopping) {
    animationClass = 'animate-pop';
  } else if (theme.id === 'sea') {
    animationClass = 'animate-swim-rl';
    style.top = `${entity.lane ? entity.lane * 14 : 50}%`; 
    style.left = '100vw'; 
  } else if (theme.id === 'forest') {
    animationClass = 'animate-grow';
    style.left = `${entity.startX}%`;
    style.top = `${entity.startY}%`;
    
    if (isDragging || (position.x !== 0 || position.y !== 0)) {
       style.transform = `translate(${position.x}px, ${position.y}px)`;
       animationClass = ''; 
       style.zIndex = 100; 
    } else {
       style.zIndex = 30; 
       // Slight random rotation for forest realism
       style.transform = `rotate(${Math.random() * 20 - 10}deg)`;
    }
  } else {
    animationClass = 'animate-float';
    style.left = `${entity.startX}%`;
    style.bottom = '-15%'; 
  }

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (theme.id === 'forest') return; 

    e.stopPropagation();
    if (interacted) return;
    setInteracted(true);
    setClicked(true);
    
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
         if (e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
         }
    } else {
         clientX = (e as React.MouseEvent).clientX;
         clientY = (e as React.MouseEvent).clientY;
    }
    clickPosRef.current = { x: clientX, y: clientY };

    if (theme.id === 'sky') {
        setIsPopping(true);
        setTimeout(() => {
            onClick(entity.id, entity.isTarget, entity.letter, clientX, clientY);
        }, 100);
    } else {
        onClick(entity.id, entity.isTarget, entity.letter, clientX, clientY);
    }
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    if (theme.id !== 'forest') return;
    setIsDragging(true);
    dragStartRef.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y
    });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (elementRef.current && onDrop) {
        const rect = elementRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        onDrop(entity.id, centerX, centerY);
    }
    
    setTimeout(() => {
         if (!clicked) setPosition({ x: 0, y: 0 });
    }, 100);
  };

  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX, e.clientY);
  const onMouseUp = () => handleDragEnd();
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleDragEnd();

  useEffect(() => {
    if (isDragging) {
        const handleGlobalMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
        const handleGlobalUp = () => handleDragEnd();
        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
        };
    }
  });

  const renderIcon = () => {
    // UPDATED: Fish Size (w-44 / w-52) - 80% larger
    const fishSize = "w-44 h-44 md:w-52 md:h-52 transition-transform"; 
    const standardSize = "w-16 h-16 md:w-20 md:h-20 transition-transform";

    switch (theme.objectIcon) {
      case 'fish':
        const colorClass = entity.color || 'text-orange-400 fill-orange-200';
        return <Fish className={`${fishSize} ${colorClass} drop-shadow-lg`} strokeWidth={1.5} />;
      case 'apple':
        return <Apple className={`${standardSize} text-red-600 fill-red-500 drop-shadow-lg ${isDragging ? 'scale-110' : ''}`} />;
      case 'balloon':
        const balloonColor = entity.color || 'text-red-500 fill-red-400';
        const baseColor = balloonColor.split('-')[1];
        return (
          <div className="relative group">
             <div className="absolute top-[95%] left-1/2 w-0.5 h-16 bg-white/70 -translate-x-1/2 origin-top animate-bounce-slow"></div>
             <div className={`w-20 h-24 md:w-24 md:h-28 rounded-[50%] rounded-b-[40%] shadow-inner flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-${baseColor}-400 to-${baseColor}-600 border border-${baseColor}-500`}>
                <div className="absolute top-3 right-5 w-6 h-4 bg-white/40 blur-sm rounded-full transform rotate-45"></div>
             </div>
             <div className={`absolute bottom-[-6px] left-1/2 w-3 h-3 bg-${baseColor}-600 -translate-x-1/2 rounded-sm rotate-45`}></div>
          </div>
        ); 
      default:
        return <div className={`${standardSize} rounded-full bg-white/50`} />;
    }
  };

  if (clicked && entity.isTarget && theme.id !== 'forest' && !isPopping) {
    return null; 
  }

  // Bonus Visuals (Gold Glow)
  const bonusClass = entity.isBonus ? 'drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-110' : '';

  return (
    <div
      ref={elementRef}
      className={`absolute flex items-center justify-center select-none ${animationClass} ${interacted && !entity.isTarget ? 'shake opacity-50' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${bonusClass}`}
      style={style}
      onAnimationEnd={() => {
        if (isPopping) {
             onClick(entity.id, entity.isTarget, entity.letter, clickPosRef.current.x, clickPosRef.current.y);
        } else {
             onAnimationEnd(entity.id)
        }
      }}
      onClick={theme.id !== 'forest' ? handleClick : undefined}
      onTouchStart={theme.id !== 'forest' ? handleClick : onTouchStart}
      onMouseDown={theme.id === 'forest' ? onMouseDown : undefined}
      onTouchMove={theme.id === 'forest' ? onTouchMove : undefined}
      onTouchEnd={theme.id === 'forest' ? onTouchEnd : undefined}
    >
      <div className="relative transform transition-transform active:scale-95 flex items-center justify-center pointer-events-none">
        {renderIcon()}
        
        {/* TEXT LAYER */}
        {/* UPDATED: Larger Font Size (text-5xl md:text-7xl) for Fish */}
        <span 
            className={`absolute inset-0 flex items-center justify-center font-black ${entity.isBonus ? 'text-yellow-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-white drop-shadow-md'} pb-2
            ${theme.id === 'sea' ? 'text-5xl md:text-7xl' : 'text-3xl md:text-5xl'}`} 
            style={{ 
                fontFamily: '"Baloo Bhaijaan 2", sans-serif',
                transform: theme.id === 'sea' ? 'scaleX(-1)' : 'none' 
            }}
        >
          {entity.letter}
        </span>
      </div>
    </div>
  );
};

export default GameObject;