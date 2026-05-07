import React from "react";
import { Composition } from "remotion";
import { HandshakeExplainer } from "./HandshakeExplainer.jsx";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HandshakeExplainer"
        component={HandshakeExplainer}
        durationInFrames={2220}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HandshakeExplainerVoiceover"
        component={HandshakeExplainer}
        durationInFrames={2220}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ withVoiceover: true }}
      />
    </>
  );
};
