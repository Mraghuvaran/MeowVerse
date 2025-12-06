# MeowVerse

MeowVerse is an interactive, browser-based application where you can summon unique cats by clicking anywhere on the screen.

## Features

- **Procedural Cats**: Each cat is unique, with different breeds (Siamese, Persian, Tabby, etc.), colors, sizes, and random wandering behaviors.
- **Synthesized Audio**: Uses the Web Audio API to generate unique "meows" and "purrs" in real-time based on the cat's breed and mood. No external sound files required!
- **Interactive**: Click on existing cats to pet them. They will react with sounds and animations.
- **Offline Capable**: The app runs entirely client-side using React and native browser APIs. No external AI APIs are required.

## Tech Stack

- **React 19**: UI rendering.
- **TypeScript**: Type safety.
- **Tailwind CSS**: Styling.
- **Web Audio API**: Procedural sound generation (Oscillators, Filters, Envelopes).
- **SVG**: Vector-based cat rendering.

## How to Run

1. Open `index.html` in a modern web browser.
2. Click anywhere to start the audio context and summon your first cat.
3. Enjoy the meows!
