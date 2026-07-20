/** Lightweight Web Audio SFX — no asset files required. */

type Tone = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  slide?: number;
};

let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function playTone({ freq, duration, type = "sine", gain = 0.08, slide }: Tone) {
  const audio = getCtx();
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (slide) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, freq * slide),
      audio.currentTime + duration,
    );
  }
  amp.gain.setValueAtTime(gain, audio.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

export const sfx = {
  unlock() {
    getCtx();
  },
  click() {
    playTone({ freq: 880, duration: 0.05, type: "triangle", gain: 0.05 });
  },
  claim() {
    playTone({ freq: 523, duration: 0.12, type: "square", gain: 0.06 });
    setTimeout(() => playTone({ freq: 659, duration: 0.12, type: "square", gain: 0.06 }), 80);
    setTimeout(() => playTone({ freq: 784, duration: 0.18, type: "square", gain: 0.07 }), 160);
  },
  spinStart() {
    playTone({ freq: 180, duration: 0.35, type: "sawtooth", gain: 0.04, slide: 1.8 });
  },
  reelTick() {
    playTone({ freq: 420 + Math.random() * 80, duration: 0.04, type: "square", gain: 0.03 });
  },
  reelStop() {
    playTone({ freq: 220, duration: 0.1, type: "triangle", gain: 0.06 });
    playTone({ freq: 440, duration: 0.08, type: "sine", gain: 0.04 });
  },
  winSmall() {
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => playTone({ freq: f, duration: 0.12, type: "triangle", gain: 0.07 }), i * 70);
    });
  },
  winBig() {
    [392, 523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => playTone({ freq: f, duration: 0.16, type: "square", gain: 0.07 }), i * 90);
    });
  },
  bonus() {
    [440, 554, 659, 880, 1108].forEach((f, i) => {
      setTimeout(
        () => playTone({ freq: f, duration: 0.2, type: "sawtooth", gain: 0.055, slide: 1.15 }),
        i * 100,
      );
    });
  },
  boostOn() {
    playTone({ freq: 300, duration: 0.15, type: "sawtooth", gain: 0.05, slide: 2.2 });
  },
  lose() {
    playTone({ freq: 220, duration: 0.2, type: "triangle", gain: 0.05, slide: 0.5 });
  },
};
