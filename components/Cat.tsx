
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { CatData, CatMood, CatBreed } from '../types';
import { generateCatThought, generateCatSpeech } from '../services/geminiService';

interface CatProps {
  data: CatData;
  audioContext: AudioContext | null;
  onInteract?: (id: string) => void;
}

const Cat: React.FC<CatProps> = ({ data, audioContext, onInteract }) => {
  const [visible, setVisible] = useState(false);
  const [thought, setThought] = useState<string>('');
  const [mood, setMood] = useState<CatMood>(CatMood.PLAYFUL);
  const [loading, setLoading] = useState(true);
  
  // Movement state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotationOffset, setRotationOffset] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState('0.5s');

  // Interaction state
  const [isInteracting, setIsInteracting] = useState(false);
  const [hearts, setHearts] = useState<{id: number, x: number, y: number}[]>([]);

  // Lifecycle state
  const [ageScale, setAgeScale] = useState(1);
  const [isOld, setIsOld] = useState(false);
  
  // Random animation timings to make each cat unique
  const isLazy = data.breed === CatBreed.PERSIAN || data.breed === CatBreed.SCOTTISH_FOLD || data.breed === CatBreed.RAGDOLL;
  const isHyper = data.breed === CatBreed.SIAMESE || data.breed === CatBreed.BENGAL || data.breed === CatBreed.SPHYNX;

  const blinkDuration = useRef(3 + Math.random() * 4).current; 
  const breatheDuration = useRef((isLazy ? 3.5 : 2) + Math.random() * 2).current; 
  const twitchDuration = useRef((isHyper ? 2 : 4) + Math.random() * 4).current; 
  const tailDuration = useRef((isHyper ? 1.5 : 3) + Math.random() * 2).current;

  // Visual Variation Traits (Generated once per cat)
  const traits = useMemo(() => ({
    earHeight: Math.random() * 8 - 4,   // Taller or shorter ears
    earWidth: Math.random() * 4 - 2,    // Wider or narrower base
    eyeSpacing: Math.random() * 5 - 2.5, // Eyes closer or further apart
    eyeSize: 0.9 + Math.random() * 0.3,  // Smaller or larger eyes
    faceSquash: 0.95 + Math.random() * 0.1, // Slightly rounder or flatter face
    whiskerAngle: Math.random() * 20 - 10,
    stripeConfig: {
        count: Math.floor(Math.random() * 2) + 2, // 2 or 3 side stripes
        offset: Math.random() * 5,
        irregularity: Math.random() * 5
    }
  }), []);

  // Lifecycle check loop
  useEffect(() => {
    const checkAge = setInterval(() => {
        const age = Date.now() - data.createdAt;
        const LIFESPAN = 60000; // Match the App.tsx pruning time
        
        // Start shrinking/fading in the last 20% of life
        if (age > LIFESPAN * 0.8) {
            const remaining = Math.max(0, LIFESPAN - age);
            const fadeRatio = remaining / (LIFESPAN * 0.2);
            setAgeScale(fadeRatio);
            setIsOld(true); // Triggers sleepy eyes
        }
    }, 1000);

    return () => clearInterval(checkAge);
  }, [data.createdAt]);

  useEffect(() => {
    // Animation trigger (Pop-in)
    requestAnimationFrame(() => setVisible(true));

    // If I have a parent, do a little "Hello" jump shortly after spawning
    if (data.parentId) {
        setTimeout(() => {
            setIsInteracting(true);
            setTimeout(() => setIsInteracting(false), 500);
        }, 800);
    }

    // Wandering logic
    let wanderTimeout: ReturnType<typeof setTimeout>;

    const startWandering = () => {
      // Random Wander
      
      // Switch to slower, smoother movement for wandering
      setTransitionDuration(`${3 + Math.random() * 2}s`); 

      // Random position drift relative to Spawn Point
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 80; 
      
      setOffset({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });

      // Gentle rotation sway
      setRotationOffset((Math.random() - 0.5) * 30); 

      // Schedule next move
      const nextMoveDelay = 4000 + Math.random() * 4000; 
      wanderTimeout = setTimeout(startWandering, nextMoveDelay);
    };
    
    // Start wandering after the pop-in animation completes
    const initialDelay = setTimeout(startWandering, 1000);

    const fetchPersonality = async () => {
      // 1. Get text with Breed context
      const { text, mood: newMood } = await generateCatThought(data.breed);
      setThought(text);
      setMood(newMood);
      
      // 2. Get audio if context exists
      if (audioContext && audioContext.state === 'running') {
        // If child, maybe delay speech slightly so parent and child don't talk over each other immediately
        const delay = data.parentId ? 500 : 0;
        setTimeout(async () => {
            const buffer = await generateCatSpeech(text, newMood, data.breed, audioContext);
            if (buffer) {
              playAudio(buffer, audioContext);
            }
        }, delay);
      }
      setLoading(false);
    };

    fetchPersonality();

    return () => {
        clearTimeout(initialDelay);
        clearTimeout(wanderTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const playAudio = (buffer: AudioBuffer, ctx: AudioContext) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Simple gain for volume
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.8;
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
  };

  const handleInteract = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Prevent spawning new cat
    
    if (onInteract) {
        onInteract(data.id);
    }

    if (isInteracting) return;
    setIsInteracting(true);

    // Spawn hearts
    const newHearts = Array.from({ length: 3 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 60,
        y: -50 - Math.random() * 40
    }));
    setHearts(newHearts);

    // Play interaction sound
    if (audioContext && audioContext.state === 'running') {
      const buffer = await generateCatSpeech('', mood, data.breed, audioContext);
      if (buffer) {
        playAudio(buffer, audioContext);
      }
    }

    // Reset interaction animation
    setTimeout(() => {
        setIsInteracting(false);
        setHearts([]);
    }, 600); // Slightly longer for the jump/heart animation
  };

  // --- Visual Render Helpers ---

  const renderTail = () => {
    let tailColor = data.color;
    let strokeWidth = "8";
    
    if (data.breed === CatBreed.SIAMESE || data.breed === CatBreed.RAGDOLL) {
        tailColor = "#3e2723"; // Dark point color
    }
    if (data.breed === CatBreed.SPHYNX) {
        strokeWidth = "4"; // Rat tail
    }
    if (data.breed === CatBreed.RAGDOLL || data.breed === CatBreed.PERSIAN) {
        strokeWidth = "12"; // Fluffy tail
    }

    return (
        <g style={{
            animation: `tailWiggle ${tailDuration}s ease-in-out infinite alternate`,
            transformOrigin: '40px 80px'
        }}>
            <path d="M 40 80 Q 10 80 10 40" stroke={tailColor} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
        </g>
    );
  };

  const renderEars = () => {
    // Dynamic points based on visual traits
    let { earHeight: eh, earWidth: ew } = traits;

    if (data.breed === CatBreed.SPHYNX) {
        eh += 6; // Big ears
        ew += 3;
    }

    switch (data.breed) {
        case CatBreed.SCOTTISH_FOLD:
            return (
                <g style={{ animation: `twitch ${twitchDuration}s ease-in-out infinite`, transformOrigin: '50px 50px' }}>
                    <path d={`M25 35 L${20+ew} ${42+eh} L35 40 Z`} fill={data.color} stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
                    <path d={`M75 35 L${80-ew} ${42+eh} L65 40 Z`} fill={data.color} stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
                  </g>
            );
        case CatBreed.SIAMESE:
        case CatBreed.RAGDOLL:
            const pointColor = "#3e2723"; 
            return (
                <g style={{ animation: `twitch ${twitchDuration}s ease-in-out infinite`, transformOrigin: '50px 50px' }}>
                    <path d={`M${15-ew} 35 L${12-ew/2} ${5-eh} L40 25 Z`} fill={pointColor} />
                    <path d={`M${85+ew} 35 L${88+ew/2} ${5-eh} L60 25 Z`} fill={pointColor} />
                  </g>
            );
        case CatBreed.PERSIAN:
             return (
                <g style={{ animation: `twitch ${twitchDuration}s ease-in-out infinite`, transformOrigin: '50px 50px' }}>
                    <path d={`M20 35 L${18-ew} ${20-eh} L35 28 Z`} fill={data.color} />
                    <path d={`M80 35 L${82+ew} ${20-eh} L65 28 Z`} fill={data.color} />
                  </g>
            );
        default:
            return (
                <g style={{ animation: `twitch ${twitchDuration}s ease-in-out infinite`, transformOrigin: '50px 50px' }}>
                    <path d={`M${20-ew} 30 L${20-ew} ${10-eh} L40 20 Z`} fill={data.color} />
                    <path d={`M${80+ew} 30 L${80+ew} ${10-eh} L60 20 Z`} fill={data.color} />
                  </g>
            );
    }
  };

  const renderBodyAndHead = () => {
    const isSiamese = data.breed === CatBreed.SIAMESE;
    const isPersian = data.breed === CatBreed.PERSIAN;
    const isRagdoll = data.breed === CatBreed.RAGDOLL;
    const isBengal = data.breed === CatBreed.BENGAL;
    const isSphynx = data.breed === CatBreed.SPHYNX;
    
    let faceMask = null;
    if (isSiamese || isRagdoll) {
        faceMask = (
            <circle cx="50" cy="50" r={isRagdoll ? 22 : 20} fill="#3e2723" fillOpacity={isRagdoll ? "0.6" : "0.8"} style={{ filter: 'blur(4px)' }} />
        );
    }

    let coatPattern = null;
    if (data.breed === CatBreed.TABBY) {
        const { count, offset, irregularity } = traits.stripeConfig;
        const stripePaths = [];
        // Forehead 'M'
        stripePaths.push(
            <path key="m-mark" d={`M40 30 L45 ${38+irregularity} L50 30 L55 ${38-irregularity} L60 30`} fill="none" />
        );
        // Side stripes
        for(let i=0; i<count; i++) {
             stripePaths.push(<path key={`l-${i}`} d={`M${20+i*2} ${50-i*4+offset} L${30+i} 50`} />);
             stripePaths.push(<path key={`r-${i}`} d={`M${80-i*2} ${50-i*4+offset} L${70-i} 50`} />);
        }
        coatPattern = (
            <g stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round">{stripePaths}</g>
        );
    } else if (isBengal) {
        const spots = [];
        // Generate random spots
        for(let i=0; i<5; i++) {
            spots.push(<ellipse key={`b-${i}`} cx={25 + i*12} cy={55 + (i%2)*5} rx={3} ry={2} transform={`rotate(${Math.random()*180})`} fill="#78350f" fillOpacity="0.6"/>);
            spots.push(<ellipse key={`b2-${i}`} cx={30 + i*10} cy={30 + (i%2)*5} rx={2} ry={2} transform={`rotate(${Math.random()*180})`} fill="#78350f" fillOpacity="0.4"/>);
        }
        coatPattern = <g>{spots}</g>;
    } else if (isSphynx) {
        // Wrinkles
        coatPattern = (
            <g stroke="rgba(0,0,0,0.15)" strokeWidth="1" fill="none">
                <path d="M40 25 Q50 30 60 25" />
                <path d="M35 30 Q50 35 65 30" />
                <path d="M25 50 Q30 55 25 60" />
                <path d="M75 50 Q70 55 75 60" />
            </g>
        );
    }

    return (
        <>
           {isPersian || isRagdoll ? (
               <ellipse cx="50" cy="55" rx={40 * traits.faceSquash} ry="35" fill={data.color} />
           ) : (
               <circle cx="50" cy="50" r="35" fill={data.color} transform={`scale(${traits.faceSquash}, 1)`} transform-origin="50 50" />
           )}
           {faceMask}
           {coatPattern}
        </>
    );
  };
  
  let eyeColor = "white";
  let pupilColor = "black";
  if (data.breed === CatBreed.SIAMESE || data.breed === CatBreed.RAGDOLL) { eyeColor = "#60a5fa"; } 
  if (data.breed === CatBreed.BLACK) { eyeColor = "#fbbf24"; } 
  if (data.breed === CatBreed.SCOTTISH_FOLD || data.breed === CatBreed.BENGAL) { eyeColor = "#f59e0b"; }

  // Use ageScale to fade/shrink at end of life
  const currentScale = visible 
    ? (isInteracting ? data.scale * 1.15 : data.scale * ageScale) 
    : 0;
  
  const currentOpacity = ageScale; // Fade out

  // Eye Positions
  const leftEyeCx = 38 - traits.eyeSpacing;
  const rightEyeCx = 62 + traits.eyeSpacing;
  const eyeRadius = 5 * traits.eyeSize;
  const pupilRadius = 2 * traits.eyeSize;

  return (
    <div
      onClick={handleInteract}
      onTouchStart={handleInteract}
      className={`absolute ease-in-out transform pointer-events-auto cursor-pointer select-none flex flex-col items-center justify-center hover:brightness-110`}
      style={{
        left: data.x,
        top: data.y,
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${currentScale}) rotate(${data.rotation + rotationOffset}deg)`,
        opacity: currentOpacity,
        zIndex: Math.floor(data.y), 
        transitionProperty: 'transform, opacity, filter',
        transitionDuration: isInteracting ? '0.2s' : transitionDuration,
      }}
    >
      <style>{`
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        @keyframes breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1px) scale(1.02); }
        }
        @keyframes twitch {
          0%, 100% { transform: rotate(0deg); }
          5% { transform: rotate(3deg); }
          10% { transform: rotate(-3deg); }
          15% { transform: rotate(0deg); }
        }
        @keyframes tailWiggle {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(15deg); }
        }
        @keyframes jump {
            0% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0); }
        }
        @keyframes floatHeart {
            0% { opacity: 1; transform: translateY(0) scale(0.5); }
            100% { opacity: 0; transform: translateY(-40px) scale(1.2); }
        }
      `}</style>

      {/* Thought Bubble */}
      <div 
        className={`mb-2 bg-white text-slate-900 text-xs sm:text-sm font-bold px-3 py-2 rounded-2xl shadow-lg border-2 border-slate-200 max-w-[200px] text-center transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${visible ? 'translate-y-0' : 'translate-y-4'}`}
      >
        {thought}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white"></div>
      </div>

      {/* SVG Cat */}
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xl"
        style={{
            animation: isInteracting ? 'jump 0.5s ease-out' : 'none'
        }}
      >
        {/* Hearts Particles */}
        {hearts.map(h => (
            <path 
                key={h.id}
                d="M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z"
                fill="#f43f5e"
                style={{
                    transformOrigin: 'center',
                    transform: `translate(${h.x}px, ${h.y}px) scale(0.2)`,
                    opacity: 0,
                    animation: 'floatHeart 0.6s ease-out forwards'
                }}
            />
        ))}

        <g style={{ 
          animation: `breathe ${breatheDuration}s ease-in-out infinite`,
          transformOrigin: '50px 100px'
        }}>
          {renderTail()}
          {renderEars()}
          {renderBodyAndHead()}
          
          {/* Eyes Container */}
          {mood !== CatMood.SLEEPY && !isOld ? (
             <g style={{ 
               animation: `blink ${blinkDuration}s infinite`,
               transformOrigin: '50px 45px'
             }}>
               <circle cx={leftEyeCx} cy="45" r={eyeRadius} fill={eyeColor} />
               <circle cx={leftEyeCx} cy="45" r={pupilRadius} fill={pupilColor} />
               <circle cx={rightEyeCx} cy="45" r={eyeRadius} fill={eyeColor} />
               <circle cx={rightEyeCx} cy="45" r={pupilRadius} fill={pupilColor} />
             </g>
          ) : (
            <g>
              <path d={`M${leftEyeCx-5} 45 Q${leftEyeCx} 48 ${leftEyeCx+5} 45`} stroke="black" strokeWidth="2" fill="none" />
              <path d={`M${rightEyeCx-5} 45 Q${rightEyeCx} 48 ${rightEyeCx+5} 45`} stroke="black" strokeWidth="2" fill="none" />
            </g>
          )}

          <path d="M47 55 L53 55 L50 60 Z" fill="pink" />
          
          <g transform={data.breed === CatBreed.PERSIAN ? "translate(0, -3)" : ""}>
            <path d="M50 60 Q45 65 40 60" stroke="black" strokeWidth="2" fill="none" />
            <path d="M50 60 Q55 65 60 60" stroke="black" strokeWidth="2" fill="none" />
          </g>

          <g style={{ 
             animation: `twitch ${twitchDuration * 0.7}s ease-in-out infinite`,
             transformOrigin: '50px 55px',
             animationDelay: '1s',
             transform: `rotate(${traits.whiskerAngle}deg)`
          }}>
            <line x1="20" y1="50" x2="35" y2="52" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="20" y1="55" x2="35" y2="55" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="80" y1="50" x2="65" y2="52" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="80" y1="55" x2="65" y2="55" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
          </g>

        </g>
      </svg>
    </div>
  );
};

export default Cat;
