/**
 * Procedural game audio via Web Audio API (no external files).
 * Lazily creates a shared AudioContext on first user-triggered sound.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.12,
  when = 0,
): void {
  const audio = getCtx()
  if (!audio) return

  const t0 = audio.currentTime + when
  const osc = audio.createOscillator()
  const amp = audio.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, t0)
  amp.gain.setValueAtTime(gain, t0)
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + duration)

  osc.connect(amp)
  amp.connect(audio.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function noiseBurst(duration: number, gain = 0.08, when = 0): void {
  const audio = getCtx()
  if (!audio) return

  const t0 = audio.currentTime + when
  const bufferSize = Math.floor(audio.sampleRate * duration)
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }

  const src = audio.createBufferSource()
  src.buffer = buffer
  const amp = audio.createGain()
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 800

  amp.gain.setValueAtTime(gain, t0)
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + duration)

  src.connect(filter)
  filter.connect(amp)
  amp.connect(audio.destination)
  src.start(t0)
  src.stop(t0 + duration)
}

function isArcadeSound(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.getAttribute('data-sound') === 'arcade'
}

/** Short crisp click when selecting a piece. */
export function playSelect(): void {
  if (isArcadeSound()) {
    tone(523, 0.04, 'square', 0.1)
    tone(784, 0.03, 'square', 0.06, 0.02)
    return
  }
  tone(880, 0.04, 'square', 0.06)
  tone(1320, 0.03, 'sine', 0.04, 0.01)
}

/** Soft sliding wooden tone for a quiet move. */
export function playMove(): void {
  if (isArcadeSound()) {
    tone(330, 0.05, 'square', 0.08)
    return
  }
  tone(220, 0.08, 'triangle', 0.1)
  tone(180, 0.12, 'sine', 0.07, 0.04)
  noiseBurst(0.06, 0.03, 0.02)
}

/** Deep tactical strike on capture. */
export function playCapture(): void {
  tone(110, 0.15, 'sawtooth', 0.14)
  tone(55, 0.2, 'square', 0.1, 0.02)
  noiseBurst(0.1, 0.12, 0.01)
}

/** Triumphant chord when a man promotes to king. */
export function playKing(): void {
  tone(523, 0.2, 'sine', 0.1, 0)
  tone(659, 0.2, 'sine', 0.09, 0.05)
  tone(784, 0.25, 'sine', 0.08, 0.1)
  tone(1047, 0.3, 'triangle', 0.06, 0.15)
}

/** Upbeat harmonic fanfare on victory. */
export function playVictory(): void {
  const notes = [523, 659, 784, 1047, 1319]
  notes.forEach((freq, i) => {
    tone(freq, 0.35, 'sine', 0.09, i * 0.12)
    tone(freq * 1.5, 0.2, 'triangle', 0.04, i * 0.12 + 0.05)
  })
}

/** Low-frequency pulse when blitz clock drops below 20s. */
export function playHeartbeat(): void {
  tone(72, 0.12, 'sine', 0.14)
  tone(96, 0.08, 'triangle', 0.06, 0.06)
}

/** Accessibility alert for invalid moves / errors. */
export function playErrorAlert(): void {
  tone(280, 0.12, 'square', 0.1)
  tone(220, 0.18, 'sawtooth', 0.08, 0.08)
}

/** High-frequency accessibility ping on captures. */
export function playAccessibilityCapture(): void {
  tone(1200, 0.06, 'sine', 0.08)
  tone(1600, 0.05, 'sine', 0.06, 0.04)
}
