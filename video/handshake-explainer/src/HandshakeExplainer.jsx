import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const colors = {
  ink: "#17202a",
  muted: "#5d6673",
  paper: "#f7f3ec",
  line: "#d8d0c3",
  green: "#267a55",
  blue: "#2b6cb0",
  red: "#b63d45",
  amber: "#c47a25",
  dark: "#1f2933",
  white: "#ffffff",
};

const scenes = [
  { key: "intro", label: "Concept", start: 0, end: 225 },
  { key: "fraud", label: "Fraude", start: 225, end: 675 },
  { key: "offline", label: "Offline", start: 675, end: 1095 },
  { key: "gdpr", label: "GDPR", start: 1095, end: 1575 },
  { key: "close", label: "Resultaat", start: 1575, end: 2220 },
];

const asset = (name) => staticFile(`screenshots/${name}`);
const audio = (name) => staticFile(`audio/${name}`);

const fade = (frame, fps, fromSeconds = 0, durationSeconds = 0.5) =>
  interpolate(
    frame,
    [fromSeconds * fps, (fromSeconds + durationSeconds) * fps],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

const rise = (frame, fps, delaySeconds = 0) =>
  interpolate(
    frame,
    [delaySeconds * fps, (delaySeconds + 0.8) * fps],
    [42, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

const slide = (frame, fps, delaySeconds = 0, distance = 80) =>
  interpolate(
    frame,
    [delaySeconds * fps, (delaySeconds + 0.9) * fps],
    [distance, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

const progressForScene = (globalFrame) => {
  const active = scenes.find((scene) => globalFrame >= scene.start && globalFrame < scene.end) ?? scenes.at(-1);
  return scenes.findIndex((scene) => scene.key === active.key);
};

const Background = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = interpolate(frame, [0, 74 * fps], [0, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: colors.paper, overflow: "hidden" }}>
      <div style={styles.grid} />
      <div
        style={{
          ...styles.topBand,
          transform: `translateX(${-drift}px)`,
        }}
      />
      <div
        style={{
          ...styles.bottomBand,
          transform: `translateX(${drift * 0.5}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const ProgressBar = () => {
  const frame = useCurrentFrame();
  const activeIndex = progressForScene(frame);

  return (
    <div style={styles.progressWrap}>
      {scenes.map((scene, index) => {
        const isActive = index <= activeIndex;
        return (
          <div key={scene.key} style={styles.progressItem}>
            <div
              style={{
                ...styles.progressDot,
                background: isActive ? colors.dark : colors.white,
                borderColor: isActive ? colors.dark : colors.line,
              }}
            />
            <div
              style={{
                ...styles.progressText,
                color: isActive ? colors.dark : colors.muted,
              }}
            >
              {scene.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SceneShell = ({ kicker, title, body, accent = colors.green, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={styles.scene}>
      <div
        style={{
          ...styles.copy,
          opacity: fade(frame, fps, 0.05),
          transform: `translateY(${rise(frame, fps, 0.05)}px)`,
        }}
      >
        <div style={{ ...styles.kicker, color: accent }}>{kicker}</div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.body}>{body}</p>
      </div>
      <div
        style={{
          ...styles.visual,
          opacity: fade(frame, fps, 0.25),
          transform: `translateX(${slide(frame, fps, 0.25)}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const ScreenshotFrame = ({ src, label, width = 720, height = 520, fit = "cover" }) => {
  return (
    <div style={{ ...styles.screenshotFrame, width, height }}>
      <div style={styles.windowBar}>
        <span style={{ ...styles.windowDot, background: colors.red }} />
        <span style={{ ...styles.windowDot, background: colors.amber }} />
        <span style={{ ...styles.windowDot, background: colors.green }} />
        <span style={styles.windowLabel}>{label}</span>
      </div>
      <Img src={src} style={{ ...styles.screenshot, objectFit: fit }} />
    </div>
  );
};

const QrMosaic = ({ pulse = 1 }) => {
  const blocks = [
    [0, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 1, 0],
    [1, 1, 1, 0, 1, 1, 0, 1, 1],
    [0, 0, 1, 1, 0, 1, 1, 0, 0],
    [1, 0, 0, 1, 1, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 1, 0, 0, 1],
    [0, 1, 1, 1, 0, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 0, 1, 0, 1],
  ];

  return (
    <div style={{ ...styles.qr, transform: `scale(${pulse})` }}>
      {blocks.flatMap((row, y) =>
        row.map((cell, x) => (
          <span
            key={`${x}-${y}`}
            style={{
              background: cell ? colors.dark : colors.white,
              borderRadius: cell ? 3 : 0,
            }}
          />
        )),
      )}
    </div>
  );
};

const TokenFlow = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame;
  const pulse = interpolate(local % (1.2 * fps), [0, 0.6 * fps, 1.2 * fps], [1, 1.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tokenX = interpolate(local, [1 * fps, 5 * fps], [52, 470], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div style={styles.flowPanel}>
      <div style={styles.device}>
        <div style={styles.deviceHeader}>Student</div>
        <QrMosaic pulse={pulse} />
        <div style={styles.timer}>15s refresh</div>
      </div>
      <div style={styles.flowLine}>
        <div style={{ ...styles.token, transform: `translateX(${tokenX}px)` }}>student:id:guid</div>
      </div>
      <div style={styles.serverBox}>
        <div style={styles.serverTitle}>API</div>
        <Metric label="TTL" value="20s" tone={colors.blue} />
        <Metric label="Gebruik" value="eenmalig" tone={colors.green} />
      </div>
    </div>
  );
};

const Metric = ({ label, value, tone }) => (
  <div style={styles.metric}>
    <span>{label}</span>
    <strong style={{ color: tone }}>{value}</strong>
  </div>
);

const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qrOpacity = fade(frame, fps, 1.1);

  return (
    <AbsoluteFill style={styles.intro}>
      <div style={{ ...styles.introText, opacity: fade(frame, fps, 0.1), transform: `translateY(${rise(frame, fps, 0.1)}px)` }}>
        <div style={styles.kicker}>PXL Research Project</div>
        <h1 style={styles.heroTitle}>Handshake App</h1>
        <p style={styles.heroBody}>Een POC voor veilige studentenidentificatie op netwerkevents.</p>
      </div>
      <div style={{ ...styles.introVisual, opacity: qrOpacity, transform: `translateY(${rise(frame, fps, 1.1)}px)` }}>
        <ScreenshotFrame src={asset("student-qr.png")} label="/student" width={500} height={650} fit="contain" />
        <div style={styles.introStack}>
          <Pill label="Roterende QR-code" tone={colors.blue} />
          <Pill label="Offline scanner queue" tone={colors.amber} />
          <Pill label="Consent + encryptie" tone={colors.green} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FraudScene = () => (
  <SceneShell
    kicker="Deelvraag 1"
    title="Fraude wordt beperkt door tijd en eenmalig gebruik."
    body="Een gekopieerde QR-code blijft maar kort bruikbaar. Zodra een bedrijf de token scant, verwijdert de server die token uit de actieve state."
    accent={colors.blue}
  >
    <div style={styles.sideBySide}>
      <TokenFlow />
      <ScreenshotFrame src={asset("token-refresh.png")} label="Network: qr-token" width={650} height={410} fit="contain" />
    </div>
  </SceneShell>
);

const OfflineScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const queueWidth = interpolate(frame, [1.2 * fps, 5.8 * fps], [92, 470], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <SceneShell
      kicker="Deelvraag 2"
      title="Netwerkuitval mag geen scans laten verdwijnen."
      body="Bij een netwerkfout bewaart de scanner de scan lokaal met de oorspronkelijke scannedAt-tijd. Het online-event synchroniseert daarna automatisch."
      accent={colors.amber}
    >
      <div style={styles.offlineGrid}>
        <ScreenshotFrame src={asset("offline-queue.png")} label="/scanner offline" width={770} height={420} fit="cover" />
        <div style={styles.queueCard}>
          <div style={styles.queueTitle}>IndexedDB queue</div>
          <div style={styles.queueTrack}>
            <div style={{ ...styles.queueFill, width: queueWidth }} />
          </div>
          <div style={styles.queueRows}>
            <QueueRow label="companyId" value="1" />
            <QueueRow label="token" value="student:..." />
            <QueueRow label="scannedAt" value="UTC ISO" />
          </div>
        </div>
      </div>
    </SceneShell>
  );
};

const QueueRow = ({ label, value }) => (
  <div style={styles.queueRow}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const GdprScene = () => (
  <SceneShell
    kicker="Deelvraag 3"
    title="Lokale data blijft versleuteld en verwerking vraagt toestemming."
    body="De queue gebruikt AES-GCM met een non-extractable sleutel. Studentregistratie vereist consent in de UI en wordt opnieuw gevalideerd door de API."
    accent={colors.green}
  >
    <div style={styles.gdprGrid}>
      <ScreenshotFrame src={asset("encrypted-indexeddb.png")} label="IndexedDB inspectie" width={650} height={280} fit="contain" />
      <ScreenshotFrame src={asset("consent.png")} label="Consent flow" width={350} height={480} fit="contain" />
      <div style={styles.lockPanel}>
        <div style={styles.lockIcon}>
          <span style={styles.lockShackle} />
          <strong style={styles.lockBody} />
        </div>
        <Metric label="Encryptie" value="AES-GCM" tone={colors.green} />
        <Metric label="Sleutel" value="non-extractable" tone={colors.blue} />
      </div>
    </div>
  </SceneShell>
);

const CloseScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    { label: "Fraudebestendig", value: "expiry + consume", tone: colors.blue },
    { label: "Offline robuust", value: "queue + sync", tone: colors.amber },
    { label: "GDPR-bewust", value: "consent + encryptie", tone: colors.green },
  ];

  return (
    <AbsoluteFill style={styles.closeScene}>
      <div style={{ ...styles.closeText, opacity: fade(frame, fps, 0.1), transform: `translateY(${rise(frame, fps, 0.1)}px)` }}>
        <div style={styles.kicker}>Resultaat van de POC</div>
        <h1 style={styles.title}>Een kleine app die drie onderzoeksvragen concreet test.</h1>
      </div>
      <div style={styles.resultGrid}>
        {items.map((item, index) => (
          <div
            key={item.label}
            style={{
              ...styles.resultCard,
              opacity: fade(frame, fps, 0.6 + index * 0.25),
              transform: `translateY(${rise(frame, fps, 0.6 + index * 0.25)}px)`,
              borderTopColor: item.tone,
            }}
          >
            <div style={{ ...styles.resultMark, background: item.tone }} />
            <h2 style={styles.resultTitle}>{item.label}</h2>
            <p style={styles.resultText}>{item.value}</p>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Pill = ({ label, tone }) => (
  <div style={{ ...styles.pill, borderColor: tone }}>
    <span style={{ background: tone }} />
    {label}
  </div>
);

const AudioBed = ({ withVoiceover = false }) => {
  const { fps } = useVideoConfig();
  const transitionFrames = [225, 675, 1095, 1575];
  const tokenPulseFrames = [305, 415, 525, 635];
  const sfxScale = withVoiceover ? 0.6 : 1;

  return (
    <>
      <Audio
        src={audio("background.wav")}
        loop
        loopVolumeCurveBehavior="extend"
        volume={(frame) =>
          interpolate(frame, [0, 2 * fps, 71 * fps, 74 * fps], [0, withVoiceover ? 0.09 : 0.22, withVoiceover ? 0.09 : 0.22, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {withVoiceover ? (
        <Sequence from={42}>
          <Audio src={audio("voiceover-elevenlabs-final.mp3")} volume={0.95} />
        </Sequence>
      ) : null}
      {transitionFrames.map((from) => (
        <Sequence key={`transition-${from}`} from={from - 2}>
          <Audio src={audio("transition.wav")} volume={0.2 * sfxScale} />
        </Sequence>
      ))}
      {tokenPulseFrames.map((from) => (
        <Sequence key={`token-${from}`} from={from}>
          <Audio src={audio("token-pulse.wav")} volume={0.18 * sfxScale} />
        </Sequence>
      ))}
      <Sequence from={795}>
        <Audio src={audio("queue.wav")} volume={0.23 * sfxScale} />
      </Sequence>
      <Sequence from={1245}>
        <Audio src={audio("lock.wav")} volume={0.2 * sfxScale} />
      </Sequence>
      <Sequence from={1625}>
        <Audio src={audio("ding.wav")} volume={0.18 * sfxScale} />
      </Sequence>
    </>
  );
};

export const HandshakeExplainer = ({ withVoiceover = false }) => {
  return (
    <AbsoluteFill style={styles.root}>
      <AudioBed withVoiceover={withVoiceover} />
      <Background />
      <ProgressBar />
      <Sequence from={0} durationInFrames={225}>
        <IntroScene />
      </Sequence>
      <Sequence from={225} durationInFrames={450}>
        <FraudScene />
      </Sequence>
      <Sequence from={675} durationInFrames={420}>
        <OfflineScene />
      </Sequence>
      <Sequence from={1095} durationInFrames={480}>
        <GdprScene />
      </Sequence>
      <Sequence from={1575} durationInFrames={645}>
        <CloseScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const styles = {
  root: {
    fontFamily: "Inter, Avenir Next, Helvetica, Arial, sans-serif",
    color: colors.ink,
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`,
    backgroundSize: "64px 64px",
    opacity: 0.24,
  },
  topBand: {
    position: "absolute",
    top: 0,
    left: -220,
    width: 1250,
    height: 170,
    background: "#dbe8e3",
    transform: "skewX(-18deg)",
  },
  bottomBand: {
    position: "absolute",
    right: -200,
    bottom: -40,
    width: 1080,
    height: 220,
    background: "#eadbc5",
    transform: "skewX(-18deg)",
  },
  progressWrap: {
    position: "absolute",
    zIndex: 20,
    left: 92,
    right: 92,
    top: 42,
    height: 48,
    display: "flex",
    alignItems: "center",
    gap: 30,
  },
  progressItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    border: "2px solid",
  },
  progressText: {
    fontSize: 22,
    fontWeight: 700,
  },
  scene: {
    padding: "142px 94px 86px",
    display: "grid",
    gridTemplateColumns: "0.9fr 1.15fr",
    gap: 54,
    alignItems: "center",
  },
  copy: {
    maxWidth: 640,
  },
  kicker: {
    fontSize: 28,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 24,
  },
  title: {
    fontSize: 70,
    lineHeight: 1.02,
    letterSpacing: 0,
    margin: 0,
    fontWeight: 900,
  },
  body: {
    marginTop: 30,
    fontSize: 32,
    lineHeight: 1.34,
    color: colors.muted,
    fontWeight: 500,
  },
  visual: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  intro: {
    padding: "145px 110px 90px",
    display: "grid",
    gridTemplateColumns: "1fr 0.98fr",
    gap: 50,
    alignItems: "center",
  },
  introText: {
    maxWidth: 790,
  },
  heroTitle: {
    fontSize: 118,
    lineHeight: 0.94,
    letterSpacing: 0,
    margin: 0,
    fontWeight: 950,
  },
  heroBody: {
    marginTop: 34,
    fontSize: 36,
    lineHeight: 1.28,
    color: colors.muted,
    fontWeight: 600,
  },
  introVisual: {
    display: "flex",
    alignItems: "center",
    gap: 36,
  },
  introStack: {
    display: "grid",
    gap: 20,
  },
  pill: {
    width: 360,
    minHeight: 74,
    border: "3px solid",
    background: colors.white,
    borderRadius: 8,
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    fontSize: 25,
    fontWeight: 800,
    boxShadow: "0 18px 40px rgba(23,32,42,0.1)",
  },
  screenshotFrame: {
    background: colors.white,
    border: `2px solid ${colors.dark}`,
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 28px 60px rgba(23,32,42,0.16)",
  },
  windowBar: {
    height: 48,
    borderBottom: `2px solid ${colors.dark}`,
    display: "flex",
    alignItems: "center",
    padding: "0 17px",
    gap: 10,
    background: "#fbfaf8",
  },
  windowDot: {
    width: 13,
    height: 13,
    borderRadius: 999,
  },
  windowLabel: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 800,
    color: colors.muted,
  },
  screenshot: {
    width: "100%",
    height: "calc(100% - 48px)",
    display: "block",
  },
  sideBySide: {
    display: "grid",
    gridTemplateRows: "auto auto",
    gap: 28,
    justifyItems: "center",
  },
  flowPanel: {
    width: 780,
    minHeight: 300,
    background: colors.white,
    border: `2px solid ${colors.dark}`,
    borderRadius: 8,
    padding: 28,
    display: "grid",
    gridTemplateColumns: "190px 1fr 190px",
    alignItems: "center",
    gap: 24,
    boxShadow: "0 24px 52px rgba(23,32,42,0.12)",
  },
  device: {
    border: `2px solid ${colors.dark}`,
    borderRadius: 8,
    padding: 14,
    background: "#fdfcf9",
    display: "grid",
    justifyItems: "center",
    gap: 12,
  },
  deviceHeader: {
    fontSize: 19,
    fontWeight: 900,
  },
  timer: {
    fontSize: 18,
    fontWeight: 900,
    color: colors.blue,
  },
  qr: {
    width: 124,
    height: 124,
    background: colors.white,
    display: "grid",
    gridTemplateColumns: "repeat(9, 1fr)",
    gridTemplateRows: "repeat(9, 1fr)",
    gap: 3,
    padding: 8,
    border: `2px solid ${colors.dark}`,
    transformOrigin: "center",
  },
  flowLine: {
    height: 7,
    background: colors.line,
    position: "relative",
    borderRadius: 999,
  },
  token: {
    position: "absolute",
    top: -30,
    left: -54,
    height: 62,
    minWidth: 176,
    borderRadius: 8,
    background: colors.blue,
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    fontWeight: 900,
    padding: "0 16px",
    whiteSpace: "nowrap",
  },
  serverBox: {
    border: `2px solid ${colors.dark}`,
    borderRadius: 8,
    padding: 18,
    display: "grid",
    gap: 14,
    background: "#fdfcf9",
  },
  serverTitle: {
    fontSize: 24,
    fontWeight: 950,
  },
  metric: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "baseline",
    fontSize: 20,
    fontWeight: 800,
    color: colors.muted,
  },
  offlineGrid: {
    display: "grid",
    gap: 28,
    justifyItems: "center",
  },
  queueCard: {
    width: 650,
    background: colors.white,
    border: `2px solid ${colors.dark}`,
    borderRadius: 8,
    padding: 28,
    boxShadow: "0 24px 52px rgba(23,32,42,0.12)",
  },
  queueTitle: {
    fontSize: 28,
    fontWeight: 950,
    marginBottom: 18,
  },
  queueTrack: {
    width: "100%",
    height: 20,
    background: "#f1e9dd",
    border: `2px solid ${colors.dark}`,
    borderRadius: 999,
    overflow: "hidden",
  },
  queueFill: {
    height: "100%",
    background: colors.amber,
  },
  queueRows: {
    marginTop: 22,
    display: "grid",
    gap: 10,
  },
  queueRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 22,
    fontWeight: 800,
    color: colors.muted,
    borderBottom: `1px solid ${colors.line}`,
    paddingBottom: 8,
  },
  gdprGrid: {
    display: "grid",
    gridTemplateColumns: "650px 350px",
    gap: 24,
    alignItems: "center",
  },
  lockPanel: {
    gridColumn: "1 / 2",
    width: 650,
    background: colors.white,
    border: `2px solid ${colors.dark}`,
    borderRadius: 8,
    padding: 24,
    display: "grid",
    gridTemplateColumns: "94px 1fr",
    gap: 26,
    alignItems: "center",
    boxShadow: "0 24px 52px rgba(23,32,42,0.12)",
  },
  lockIcon: {
    width: 78,
    height: 78,
    position: "relative",
  },
  lockShackle: {
    position: "absolute",
    left: 18,
    top: 0,
    width: 42,
    height: 38,
    border: `6px solid ${colors.dark}`,
    borderBottom: "none",
    borderRadius: "24px 24px 0 0",
  },
  lockBody: {
    position: "absolute",
    left: 6,
    bottom: 0,
    width: 66,
    height: 48,
    border: `5px solid ${colors.dark}`,
    borderRadius: 8,
    background: "#edf7f2",
  },
  closeScene: {
    padding: "150px 110px 96px",
    display: "grid",
    alignContent: "center",
    gap: 54,
  },
  closeText: {
    maxWidth: 1060,
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 28,
  },
  resultCard: {
    minHeight: 260,
    background: colors.white,
    border: `2px solid ${colors.dark}`,
    borderTop: "12px solid",
    borderRadius: 8,
    padding: 34,
    boxShadow: "0 24px 52px rgba(23,32,42,0.12)",
  },
  resultMark: {
    width: 42,
    height: 42,
    borderRadius: 999,
    marginBottom: 30,
  },
  resultTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: 0,
  },
  resultText: {
    margin: "18px 0 0",
    fontSize: 24,
    lineHeight: 1.2,
    color: colors.muted,
    fontWeight: 800,
  },
};
