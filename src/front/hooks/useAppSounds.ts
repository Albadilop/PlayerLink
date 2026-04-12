import { useEffect, useState, useCallback } from "react";
import { notificationService } from "../services/notificationService";

export type AppSoundType =
  | "notification"
  | "success"
  | "error"
  | "click"
  | "match"
  | "swipeLeft"
  | "swipeRight";

let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioContext;
}

/**
 * Whoosh audible: ruido + lowpass barrido (mucho más energía que bandpass estrecho)
 * y un triángulo grave que barre en paralelo.
 */
function playCardSwipeSound(ctx: AudioContext, direction: "left" | "right") {
  const duration = 0.16;
  const t0 = ctx.currentTime;
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.55;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.Q.value = 0.85;
  if (direction === "right") {
    lowpass.frequency.setValueAtTime(280, t0);
    lowpass.frequency.exponentialRampToValueAtTime(9000, t0 + duration);
  } else {
    lowpass.frequency.setValueAtTime(9000, t0);
    lowpass.frequency.exponentialRampToValueAtTime(220, t0 + duration);
  }

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, t0);
  noiseGain.gain.linearRampToValueAtTime(0.18, t0 + 0.012);
  noiseGain.gain.exponentialRampToValueAtTime(0.002, t0 + duration + 0.04);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  if (direction === "right") {
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(520, t0 + duration);
  } else {
    osc.frequency.setValueAtTime(520, t0);
    osc.frequency.exponentialRampToValueAtTime(120, t0 + duration);
  }

  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0, t0);
  toneGain.gain.linearRampToValueAtTime(0.12, t0 + 0.015);

  toneGain.gain.exponentialRampToValueAtTime(0.002, t0 + duration + 0.04);

  const master = ctx.createGain();
  master.gain.value = 1;

  noise.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(master);

  osc.connect(toneGain);
  toneGain.connect(master);

  master.connect(ctx.destination);

  noise.start(t0);
  osc.start(t0);
  noise.stop(t0 + duration + 0.05);
  osc.stop(t0 + duration + 0.05);
}

function playToneBurst(
  ctx: AudioContext,
  start: number,
  freq: number,
  duration: number,
  peakGain: number,
  type: "sine" | "triangle"
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.connect(g);
  g.connect(ctx.destination);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peakGain, start + 0.018);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.025);
}

/** Fanfarria tipo celebración: arpegio rápido + acorde final brillante. */
function playMatchFanfare(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  const staccato = 0.1;
  const gap = 0.07;

  const runUp: { f: number; g: number; t: number }[] = [
    { f: 392, g: 0.1, t: 0 },
    { f: 523.25, g: 0.1, t: gap },
    { f: 659.25, g: 0.11, t: gap * 2 },
    { f: 783.99, g: 0.11, t: gap * 3 },
  ];

  runUp.forEach(({ f, g, t }) => {
    playToneBurst(ctx, t0 + t, f, staccato, g, "triangle");
  });

  const chordStart = t0 + gap * 4 + 0.02;
  const chordLen = 0.42;
  const chord: { f: number; peak: number }[] = [
    { f: 523.25, peak: 0.06 },
    { f: 659.25, peak: 0.065 },
    { f: 783.99, peak: 0.07 },
    { f: 1046.5, peak: 0.12 },
  ];

  chord.forEach(({ f, peak }) => {
    const osc = ctx.createOscillator();
    const gn = ctx.createGain();
    osc.type = f >= 900 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(f, chordStart);
    osc.connect(gn);
    gn.connect(ctx.destination);
    gn.gain.setValueAtTime(0, chordStart);
    gn.gain.linearRampToValueAtTime(peak, chordStart + 0.035);
    gn.gain.setValueAtTime(peak * 0.92, chordStart + chordLen * 0.45);
    gn.gain.exponentialRampToValueAtTime(0.001, chordStart + chordLen);
    osc.start(chordStart);
    osc.stop(chordStart + chordLen + 0.03);
  });

  const sparkleStart = chordStart + 0.08;
  playToneBurst(ctx, sparkleStart, 1318.51, 0.14, 0.045, "sine");
  playToneBurst(ctx, sparkleStart + 0.05, 1567.98, 0.12, 0.04, "sine");
}

export const useAppSounds = () => {
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("appSounds");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("appSounds", soundsEnabled.toString());
  }, [soundsEnabled]);

  const playSound = useCallback(
    (soundType: AppSoundType) => {
      if (!soundsEnabled) return;
      if (soundType === "match" && !notificationService.shouldPlaySound()) return;

      void (async () => {
        try {
          const audioContext = getSharedAudioContext();
          await audioContext.resume();

          if (soundType === "match") {
            playMatchFanfare(audioContext);
            return;
          }

          if (soundType === "swipeLeft") {
            playCardSwipeSound(audioContext, "left");
            return;
          }

          if (soundType === "swipeRight") {
            playCardSwipeSound(audioContext, "right");
            return;
          }

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          const frequencies: Record<string, number> = {
            notification: 800,
            success: 600,
            error: 400,
            click: 1000,
          };

          const t0 = audioContext.currentTime;
          const duration = 0.1;

          oscillator.frequency.value = frequencies[soundType] || 800;
          oscillator.type = "sine";
          gainNode.gain.setValueAtTime(0.1, t0);
          gainNode.gain.exponentialRampToValueAtTime(0.01, t0 + duration);

          oscillator.start(t0);
          oscillator.stop(t0 + duration);
        } catch (error) {
          console.debug("Could not play sound:", error);
        }
      })();
    },
    [soundsEnabled]
  );

  return {
    soundsEnabled,
    setSoundsEnabled,
    playSound,
  };
};
