import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cat from './components/Cat';
import { CatData, CatBreed, ToyData, ToyType } from './types';
import { v4 as uuidv4 } from 'uuid';
import { startAmbientLoop } from './services/geminiService';

// Helper to pick a color based on breed
const getColorForBreed = (breed: CatBreed) => {
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    switch (breed) {
        case CatBreed.SIAMESE:
            return pick(['#FDF5E6', '#fae8d0', '#f3e5dc']); // Old Lace, Cream variants
        case CatBreed.BLACK:
            return pick(['#1f2937', '#111827', '#374151', '#0f172a']); // Slate 800, 900, 700, Slate Blue
        case CatBreed.PERSIAN:
            return pick(['#f3f4f6', '#e5e7eb', '#d1d5db', '#fff1f2']); // White, Grey, Light Pinkish
        case CatBreed.SCOTTISH_FOLD:
            return pick(['#94a3b8', '#cbd5e1', '#64748b', '#a7b3c2']); // Blue/Grey variants
        case CatBreed.TABBY:
            return pick(['#fbbf24', '#f87171', '#a3e635', '#d97706', '#b45309', '#a16207']); // Oranges, Reds, Browns
        default:
            return '#fbbf24';
    }
};

const App: React.FC = () => {
  const [cats, setCats] = useState<CatData[]>([]);
  const [toys, setToys] = useState<ToyData[]>([]);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Constants
  const CAT_LIFESPAN_MS = 60000; // Cats live for 60 seconds

  // Initialize AudioContext on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Start ambient noise once audio is enabled
      startAmbientLoop(ctx);
    }
  }, [audioContext]);

  // Lifecycle Management Loop (Cats & Toys)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      
      // Prune Cats
      setCats(prevCats => prevCats.filter(cat => {
        const age = currentTime - cat.createdAt;
        return age < CAT_LIFESPAN_MS;
      }));

      // Prune Toys
      setToys(prevToys => prevToys.filter(toy => currentTime < toy.expiresAt));

      // Randomly spawn a toy (10% chance per check if low count)
      setToys(prevToys => {
          if (prevToys.length < 2 && Math.random() < 0.05) {
              const type: ToyType = Math.random() > 0.5 ? 'laser' : 'yarn';
              const padding = 100;
              const newToy: ToyData = {
                  id: uuidv4(),
                  x: padding + Math.random() * (window.innerWidth - padding * 2),
                  y: padding + Math.random() * (window.innerHeight - padding * 2),
                  type,
                  createdAt: currentTime,
                  expiresAt: currentTime + (10000 + Math.random() * 10000) // 10-20s duration
              };
              return [...prevToys, newToy];
          }
          return prevToys;
      });

    }, 100); 

    return () => clearInterval(interval);
  }, []);

  const handleScreenClick = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    initAudio();

    // Prevent spawning if clicking a toy (optional, simplistic check handled by z-index usually)
    
    // Get coordinates
    let targetX, targetY;
    if ('touches' in e) {
        // Touch event
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
    } else {
        // Mouse event
        targetX = (e as React.MouseEvent).clientX;
        targetY = (e as React.MouseEvent).clientY;
    }

    let spawnX = targetX;
    let spawnY = targetY;
    let selectedBreed: CatBreed;
    let parentId: string | undefined = undefined;
    let scale = 0.8 + Math.random() * 0.4;

    // Cat Family Mechanic: Chance to spawn near a "parent"
    // 30% chance if there are existing cats
    const canHaveFamily = cats.length > 0;
    const isFamilySpawn = canHaveFamily && Math.random() < 0.3;

    if (isFamilySpawn) {
        // Pick a random parent
        const parent = cats[Math.floor(Math.random() * cats.length)];
        
        // Inherit breed
        selectedBreed = parent.breed;
        parentId = parent.id;
        
        // Spawn near parent instead of click location
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 60; // 80-140px away
        spawnX = parent.x + Math.cos(angle) * distance;
        spawnY = parent.y + Math.sin(angle) * distance;

        // Keep within bounds roughly (optional, but prevents off-screen kittens)
        spawnX = Math.max(50, Math.min(window.innerWidth - 50, spawnX));
        spawnY = Math.max(50, Math.min(window.innerHeight - 50, spawnY));

        // Kittens are slightly smaller
        scale = 0.5 + Math.random() * 0.3;
    } else {
        // Random Breed
        const breeds = Object.values(CatBreed);
        selectedBreed = breeds[Math.floor(Math.random() * breeds.length)];
    }

    // Determine Color
    const selectedColor = getColorForBreed(selectedBreed);

    const newCat: CatData = {
      id: uuidv4(),
      x: spawnX,
      y: spawnY,
      rotation: Math.random() * 20 - 10, // Slight random rotation
      scale: scale,
      color: selectedColor,
      breed: selectedBreed,
      createdAt: Date.now(),
      parentId: parentId
    };

    setCats((prev) => [...prev, newCat]);

    // Cleanup old cats if too many (performance, hard limit)
    if (cats.length > 20) {
      setCats((prev) => prev.slice(1));
    }
  }, [cats, initAudio]); 

  const handleCatInteract = useCallback((id: string) => {
    // Interaction logic placeholder
  }, []);

  const clearCats = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCats([]);
    setToys([]);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black overflow-hidden cursor-crosshair touch-none"
      onClick={handleScreenClick}
      onTouchStart={handleScreenClick}
    >
      <style>{`
        @keyframes fadePulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.5; }
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes pulseLaser {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes spinYarn {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Instructional / UI Layer */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-50">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-lg mb-2">
          MeowVerse
        </h1>
        <p className="text-slate-400 text-sm md:text-base animate-pulse">
          Click to summon • Click a cat to pet • Watch them play
        </p>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
        <button
          onClick={clearCats}
          className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur-sm text-white font-semibold py-2 px-6 rounded-full shadow-lg border border-slate-600 transition-colors active:scale-95"
        >
          Shoo Cats 🧹
        </button>
      </div>

      {/* Background Ambience (Stars) */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-50">
        <svg width="100%" height="100%">
            <circle cx="20%" cy="15%" r="1" fill="white" style={{ animation: 'twinkle 3s infinite' }} />
            <circle cx="70%" cy="25%" r="2" fill="white" style={{ animation: 'twinkle 4s infinite 1s' }} />
            <circle cx="40%" cy="60%" r="1" fill="white" style={{ animation: 'twinkle 5s infinite 0.5s' }} />
            <circle cx="85%" cy="80%" r="1.5" fill="white" style={{ animation: 'twinkle 3.5s infinite 2s' }} />
            <circle cx="10%" cy="80%" r="2" fill="white" style={{ animation: 'twinkle 4.5s infinite 1.5s' }} />
        </svg>
      </div>

      {/* Render Toys */}
      {toys.map(toy => (
          <div 
            key={toy.id}
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500"
            style={{ 
                left: toy.x, 
                top: toy.y, 
                zIndex: 5 
            }}
          >
              {toy.type === 'laser' && (
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_4px_rgba(239,68,68,0.8)]" style={{ animation: 'pulseLaser 0.5s infinite' }} />
              )}
              {toy.type === 'yarn' && (
                  <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-pink-700 shadow-md flex items-center justify-center overflow-hidden">
                       <svg viewBox="0 0 20 20" className="w-full h-full opacity-50">
                           <path d="M0,10 Q10,0 20,10 T0,10" stroke="white" strokeWidth="1" fill="none" />
                           <path d="M10,0 Q20,10 10,20 T10,0" stroke="white" strokeWidth="1" fill="none" />
                       </svg>
                  </div>
              )}
          </div>
      ))}

      {/* Render Cats */}
      {cats.map((cat) => (
        <Cat 
            key={cat.id} 
            data={cat} 
            audioContext={audioContext}
            onInteract={handleCatInteract}
            toys={toys}
        />
      ))}

      {/* Footer Info */}
      <div className="absolute bottom-2 right-4 text-xs text-slate-500 pointer-events-none">
        Procedural Audio & React Native Elements
      </div>
    </div>
  );
};

export default App;
