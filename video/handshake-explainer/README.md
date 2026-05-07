# Handshake Explainer Video

Korte Remotion-video voor de presentatie van de Handshake POC.

## Scripts

```bash
npm install
npm run audio
npm run voiceover
npm run voiceover:pace
npm run studio
npm run still
npm run render
npm run render:audio
npm run render:voiceover
```

De MP4 komt terecht in `out/handshake-explainer.mp4`.
De variant met muziek en sound effects komt terecht in `out/handshake-explainer-audio.mp4`.
De variant met voice-over komt terecht in `out/handshake-explainer-voiceover.mp4`.
Standaard gebruikt die variant `public/audio/voiceover-elevenlabs-final.mp3`. `npm run voiceover` kan een lokale fallback genereren als `public/audio/voiceover.wav`; `npm run voiceover:pace` kan de oudere ElevenLabs-take met extra pauzes omzetten.
