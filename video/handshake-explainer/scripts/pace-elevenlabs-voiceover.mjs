import { execFileSync } from "node:child_process";
import { join } from "node:path";

const audioDir = join(process.cwd(), "public", "audio");
const source = join(audioDir, "voiceover-elevenlabs.mp3");
const output = join(audioDir, "voiceover-elevenlabs-paced.wav");

// The ElevenLabs file is intentionally kept as one take, then paced here to
// match the visual scene starts: offline at 19s, GDPR at 33s, conclusion at 46s.
const filter = [
  "[0:a]atrim=start=0:end=12.941,asetpts=PTS-STARTPTS[v0]",
  "anullsrc=r=44100:cl=mono:d=4.6[s1]",
  "[0:a]atrim=start=14.001:end=22.223,asetpts=PTS-STARTPTS[v1]",
  "anullsrc=r=44100:cl=mono:d=6.0[s2]",
  "[0:a]atrim=start=23.175:end=32.493,asetpts=PTS-STARTPTS[v2]",
  "anullsrc=r=44100:cl=mono:d=5.6[s3]",
  "[0:a]atrim=start=33.455:end=39.053,asetpts=PTS-STARTPTS[v3]",
  "[v0][s1][v1][s2][v2][s3][v3]concat=n=7:v=0:a=1[out]",
].join(";");

execFileSync(
  "ffmpeg",
  ["-y", "-i", source, "-filter_complex", filter, "-map", "[out]", "-ac", "1", "-ar", "44100", output],
  { stdio: "inherit" },
);
