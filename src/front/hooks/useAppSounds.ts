import { useEffect, useState, useCallback } from "react";

export const useAppSounds = () => {
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("appSounds");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("appSounds", soundsEnabled.toString());
  }, [soundsEnabled]);

  const playSound = useCallback(
    (soundType: "notification" | "success" | "error" | "click") => {
      if (!soundsEnabled) return;

      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different frequencies for different sound types
        const frequencies: Record<string, number> = {
          notification: 800,
          success: 600,
          error: 400,
          click: 1000,
        };

        oscillator.frequency.value = frequencies[soundType] || 800;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        // Silently fail if audio context is not available
        console.debug("Could not play sound:", error);
      }
    },
    [soundsEnabled]
  );

  return {
    soundsEnabled,
    setSoundsEnabled,
    playSound,
  };
};
