import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "audio");
const SCRIPT_PATH = join(OUT_DIR, "voiceover-script.txt");
const AIFF_PATH = join(OUT_DIR, "voiceover.aiff");
const WAV_PATH = join(OUT_DIR, "voiceover.wav");

const voice = process.env.VOICEOVER_VOICE ?? "Samantha";
const rate = process.env.VOICEOVER_RATE ?? "158";

const script = `Handshake is a proof of concept for student identification at networking events.

First, fraud prevention.
Each student receives a rotating QR token. The token expires quickly and can only be used once.

Second, offline reliability.
If the scanner loses network connection, scans are stored locally and synchronized when the connection returns.

Third, GDPR.
The app requires explicit consent, and queued scan data is encrypted locally using AES-GCM.

Together, the proof of concept shows a secure, offline-capable, and privacy-aware handshake flow.`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(SCRIPT_PATH, script);

execFileSync("say", ["-v", voice, "-r", rate, "-f", SCRIPT_PATH, "-o", AIFF_PATH], {
  stdio: "inherit",
});

execFileSync("ffmpeg", ["-y", "-i", AIFF_PATH, "-ac", "1", "-ar", "44100", WAV_PATH], {
  stdio: "inherit",
});

rmSync(AIFF_PATH, { force: true });
