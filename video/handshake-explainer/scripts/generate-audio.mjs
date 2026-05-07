import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 44100;
const OUT_DIR = join(process.cwd(), "public", "audio");

mkdirSync(OUT_DIR, { recursive: true });

const clamp = (value) => Math.max(-1, Math.min(1, value));

const envelope = (index, total, attack = 0.01, release = 0.08) => {
  const t = index / SAMPLE_RATE;
  const duration = total / SAMPLE_RATE;
  const attackGain = Math.min(1, t / attack);
  const releaseGain = Math.min(1, (duration - t) / release);
  return Math.max(0, Math.min(attackGain, releaseGain));
};

const writeWav = (filename, samples) => {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    buffer.writeInt16LE(Math.round(clamp(sample) * 32767), 44 + index * 2);
  });

  writeFileSync(join(OUT_DIR, filename), buffer);
};

const sine = (frequency, t) => Math.sin(2 * Math.PI * frequency * t);

const makeBackground = () => {
  const duration = 54;
  const total = Math.floor(duration * SAMPLE_RATE);
  const chords = [
    [174.61, 261.63, 329.63],
    [196, 293.66, 369.99],
    [164.81, 246.94, 329.63],
    [220, 277.18, 349.23],
  ];

  return Array.from({ length: total }, (_, index) => {
    const t = index / SAMPLE_RATE;
    const chord = chords[Math.floor(t / 13.5) % chords.length];
    const pad = chord.reduce((sum, freq, i) => sum + sine(freq, t) * (0.026 / (i + 1)), 0);
    const pulse = sine(2.1, t) > 0.72 ? 0.018 * sine(880, t) : 0;
    const shimmer = 0.012 * sine(659.25, t) * (0.5 + 0.5 * sine(0.22, t));
    const fadeIn = Math.min(1, t / 2.2);
    const fadeOut = Math.min(1, (duration - t) / 3.2);
    return (pad + pulse + shimmer) * Math.min(fadeIn, fadeOut);
  });
};

const makeTone = ({ duration, frequency, volume = 0.35, secondFrequency, attack = 0.006, release = 0.09 }) => {
  const total = Math.floor(duration * SAMPLE_RATE);
  return Array.from({ length: total }, (_, index) => {
    const t = index / SAMPLE_RATE;
    const base = sine(frequency, t);
    const second = secondFrequency ? 0.5 * sine(secondFrequency, t) : 0;
    return (base + second) * volume * envelope(index, total, attack, release);
  });
};

const makeClick = () => {
  const total = Math.floor(0.16 * SAMPLE_RATE);
  return Array.from({ length: total }, (_, index) => {
    const t = index / SAMPLE_RATE;
    const noise = Math.sin(index * 981.37) * 0.25;
    return (sine(1200, t) + noise) * 0.22 * envelope(index, total, 0.002, 0.05);
  });
};

const makeQueue = () => {
  const total = Math.floor(0.34 * SAMPLE_RATE);
  return Array.from({ length: total }, (_, index) => {
    const t = index / SAMPLE_RATE;
    const step = t < 0.16 ? sine(380, t) : sine(520, t);
    return step * 0.26 * envelope(index, total, 0.01, 0.08);
  });
};

writeWav("background.wav", makeBackground());
writeWav("transition.wav", makeClick());
writeWav("token-pulse.wav", makeTone({ duration: 0.22, frequency: 760, secondFrequency: 1140, volume: 0.22 }));
writeWav("queue.wav", makeQueue());
writeWav("lock.wav", makeTone({ duration: 0.2, frequency: 260, secondFrequency: 390, volume: 0.28, release: 0.06 }));
writeWav("ding.wav", makeTone({ duration: 0.65, frequency: 880, secondFrequency: 1320, volume: 0.24, release: 0.35 }));
