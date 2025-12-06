
import { CatMood, CatBreed } from "../types";

// --- Local Thoughts Database ---
const THOUGHTS_DB: Record<CatBreed, string[]> = {
  [CatBreed.SIAMESE]: [
    "PAY ATTENTION TO ME.",
    "Why are you looking at that other cat?",
    "I shall sing the song of my people.",
    "My ears are pointier than yours.",
    "Feed me. Now. Again.",
    "I am the loudest thing in the universe.",
    "Do you hear me? DO YOU?"
  ],
  [CatBreed.PERSIAN]: [
    "Moving is overrated.",
    "I am a cloud with claws.",
    "Worship me from afar.",
    "Too much effort.",
    "My fur is my fortune.",
    "Bring the food to my mouth.",
    "I judge you silently."
  ],
  [CatBreed.TABBY]: [
    "I rule this pixel.",
    "Did I leave the stove on? Wait, I'm a cat.",
    "Is that a cursor? MUST CATCH.",
    "Just your average world conqueror.",
    "Nap time is all the time.",
    "I blend in, therefore I am.",
    "Stripes are slimming, right?"
  ],
  [CatBreed.SCOTTISH_FOLD]: [
    "My ears are shy.",
    "Round is the perfect shape.",
    "I hear you, I just pretend I don't.",
    "Folding is my cardio.",
    "Owl or Cat? You decide.",
    "Everything is soft.",
    "Where did my ears go?"
  ],
  [CatBreed.BLACK]: [
    "I am the void.",
    "Staring into your soul...",
    "Bad luck? I'm the best luck.",
    "I disappear in the dark.",
    "Golden eyes watching you.",
    "Shadows are my friends.",
    "Spooky time."
  ],
  [CatBreed.SPHYNX]: [
    "It's chilly. Do you have a sweater?",
    "I am naked and unashamed.",
    "Fur is so last season.",
    "I feel everything.",
    "Warmth. I need warmth.",
    "Look at my wrinkles. Wisdom.",
    "I am not an alien."
  ],
  [CatBreed.RAGDOLL]: [
    "I go limp now.",
    "Carry me, peasant.",
    "Too relaxed to function.",
    "Flopping is my hobby.",
    "Softness is power.",
    "Blue eyes, full hearts, can't lose.",
    "Is it nap time? Always."
  ],
  [CatBreed.BENGAL]: [
    "I am wildness incarnate.",
    "Did something move? I caught it.",
    "Let's climb the curtains!",
    "I have jungle energy.",
    "Look at my spots!",
    "Water? Actually, I don't mind it.",
    "Chaos is my middle name."
  ]
};

const GENERIC_THOUGHTS = [
  "Meow.",
  "Prrr...",
  "Thinking about fish.",
  "Zzz...",
  "World domination imminent."
];

// --- Procedural Audio Generation ---

// Helper to create a random number between min and max
const range = (min: number, max: number) => Math.random() * (max - min) + min;

export const generateCatThought = async (breed: CatBreed): Promise<{ text: string; mood: CatMood }> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 300));

  const breedThoughts = THOUGHTS_DB[breed] || GENERIC_THOUGHTS;
  // Mix in some generic thoughts occasionally
  const pool = Math.random() > 0.7 ? GENERIC_THOUGHTS : breedThoughts;
  
  const text = pool[Math.floor(Math.random() * pool.length)];
  
  // Randomize mood slightly
  const moods = Object.values(CatMood);
  const mood = moods[Math.floor(Math.random() * moods.length)];

  return { text, mood };
};

export const generateCatSpeech = async (
  text: string, 
  mood: CatMood, 
  breed: CatBreed, 
  audioContext: AudioContext
): Promise<AudioBuffer | null> => {
  try {
    // We use OfflineAudioContext to render a sound buffer "offline" 
    // This synthesizes the sound immediately without playing it.
    const duration = range(0.4, 0.8);
    const sampleRate = audioContext.sampleRate;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

    const t = offlineCtx.currentTime;
    
    // Create nodes
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    const filter = offlineCtx.createBiquadFilter();

    // Wiring
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);

    // --- Sound Synthesis Logic ---

    // Pitch settings based on Breed
    let basePitch = 400; // Hz
    if (breed === CatBreed.SIAMESE) basePitch = 550; // Higher, whinier
    if (breed === CatBreed.PERSIAN) basePitch = 300; // Lower, lazy
    if (breed === CatBreed.SCOTTISH_FOLD) basePitch = 450;
    if (breed === CatBreed.SPHYNX) basePitch = 500; // Higher, slightly odd
    if (breed === CatBreed.RAGDOLL) basePitch = 350; // Soft, lowish
    if (breed === CatBreed.BENGAL) basePitch = 480; // Active, vocal
    
    // Mood Modifications
    let type: OscillatorType = 'sawtooth';

    if (mood === CatMood.GRUMPY) {
        basePitch -= 100;
        type = 'sawtooth'; // Buzzier
    } else if (mood === CatMood.SLEEPY) {
        basePitch -= 50;
        type = 'sine'; // Softer
    } else if (mood === CatMood.HAPPY) {
        basePitch += 50;
        type = 'triangle';
    } else if (mood === CatMood.PLAYFUL) {
        basePitch += 100;
        type = 'triangle'; 
        // Playful sounds are often shorter/chirpier, handled by envelope below
    }

    if (breed === CatBreed.RAGDOLL) type = 'sine'; // Always softer
    if (breed === CatBreed.BENGAL) type = 'sawtooth'; // More texture

    osc.type = type;

    // Pitch Envelope (The "Meow" contour)
    // Start mid, go high, drop low
    osc.frequency.setValueAtTime(basePitch, t);
    
    if (breed === CatBreed.BENGAL) {
        // Trill-like modulation for Bengal
        osc.frequency.exponentialRampToValueAtTime(basePitch * 1.2, t + duration * 0.1);
        osc.frequency.exponentialRampToValueAtTime(basePitch * 0.9, t + duration * 0.2);
        osc.frequency.exponentialRampToValueAtTime(basePitch * 1.3, t + duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(basePitch * 0.8, t + duration);
    } else {
        osc.frequency.exponentialRampToValueAtTime(basePitch * 1.5, t + duration * 0.2); // Attack up
        osc.frequency.exponentialRampToValueAtTime(basePitch * 0.8, t + duration); // Slide down
    }

    // Filter Envelope (Wah effect)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(basePitch, t);
    filter.frequency.linearRampToValueAtTime(basePitch * 4, t + duration * 0.3);
    filter.frequency.linearRampToValueAtTime(basePitch, t + duration);
    
    // Amplitude Envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + duration * 0.1); // Attack
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration); // Decay

    // Start
    osc.start(t);
    osc.stop(t + duration);

    // Special Case: Purr (AM Modulation)
    if (text.startsWith("Purr") || mood === CatMood.HAPPY) {
       // Add a second oscillator for rumble
       const lfo = offlineCtx.createOscillator();
       lfo.frequency.value = 25; // 25Hz rumble
       const lfoGain = offlineCtx.createGain();
       lfoGain.gain.value = 500; // Depth of modulation
       
       lfo.connect(lfoGain);
       lfoGain.connect(filter.frequency); // Modulate filter cutoff for purr effect
       lfo.start(t);
       lfo.stop(t + duration);
    }

    // Render
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer;

  } catch (error) {
    console.error("Error synthesizing sound:", error);
    return null;
  }
};

// --- Ambient Background Loop ---
let ambientTimeout: ReturnType<typeof setTimeout> | null = null;

export const startAmbientLoop = (ctx: AudioContext) => {
    if (ambientTimeout) return; // Already running

    const playAmbientSound = async () => {
        if (ctx.state !== 'running') {
            ambientTimeout = setTimeout(playAmbientSound, 2000);
            return;
        }

        try {
            // Very short, quiet sound
            const duration = 1.0;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            const panner = ctx.createStereoPanner();

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(panner);
            panner.connect(ctx.destination);

            osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
            osc.frequency.value = range(200, 400);
            
            // Low pass to make it sound "distant"
            filter.type = 'lowpass';
            filter.frequency.value = 600;

            // Pan randomly left or right
            panner.pan.value = range(-0.8, 0.8);

            // Very low volume
            const t = ctx.currentTime;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.03, t + 0.5);
            gain.gain.linearRampToValueAtTime(0, t + duration);

            osc.start(t);
            osc.stop(t + duration);

        } catch (e) {
            // ignore
        }

        // Schedule next sound (random interval between 5 and 15 seconds)
        ambientTimeout = setTimeout(playAmbientSound, range(5000, 15000));
    };

    playAmbientSound();
};