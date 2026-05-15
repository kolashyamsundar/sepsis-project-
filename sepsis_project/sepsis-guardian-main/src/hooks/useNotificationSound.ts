import { useCallback, useRef } from "react";

// Notification sound frequencies and patterns
const SOUND_PATTERNS = {
  notification: {
    frequencies: [800, 1000, 800],
    durations: [100, 100, 150],
    type: "sine" as OscillatorType,
  },
  emergency: {
    frequencies: [880, 440, 880, 440, 880],
    durations: [150, 150, 150, 150, 200],
    type: "square" as OscillatorType,
  },
  message: {
    frequencies: [523, 659, 784],
    durations: [80, 80, 120],
    type: "sine" as OscillatorType,
  },
  success: {
    frequencies: [523, 659, 784, 1047],
    durations: [100, 100, 100, 200],
    type: "sine" as OscillatorType,
  },
  warning: {
    frequencies: [440, 550, 440],
    durations: [200, 200, 300],
    type: "triangle" as OscillatorType,
  },
};

export type SoundType = keyof typeof SOUND_PATTERNS;

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback(async (type: SoundType = "notification") => {
    if (isPlayingRef.current) return;
    
    try {
      isPlayingRef.current = true;
      const audioContext = getAudioContext();
      
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const pattern = SOUND_PATTERNS[type];
      let currentTime = audioContext.currentTime;

      for (let i = 0; i < pattern.frequencies.length; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = pattern.type;
        oscillator.frequency.value = pattern.frequencies[i];

        // Envelope for smoother sound
        const duration = pattern.durations[i] / 1000;
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);

        currentTime += duration + 0.02; // Small gap between notes
      }

      // Reset playing state after sound completes
      setTimeout(() => {
        isPlayingRef.current = false;
      }, pattern.durations.reduce((a, b) => a + b, 0) + 100);

    } catch (error) {
      console.error("Error playing notification sound:", error);
      isPlayingRef.current = false;
    }
  }, [getAudioContext]);

  const playNotification = useCallback(() => playSound("notification"), [playSound]);
  const playEmergency = useCallback(() => playSound("emergency"), [playSound]);
  const playMessage = useCallback(() => playSound("message"), [playSound]);
  const playSuccess = useCallback(() => playSound("success"), [playSound]);
  const playWarning = useCallback(() => playSound("warning"), [playSound]);

  return {
    playSound,
    playNotification,
    playEmergency,
    playMessage,
    playSuccess,
    playWarning,
  };
}
