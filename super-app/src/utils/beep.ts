// frontend/src/utils/beep.ts
//
// Short two-tone beep via Web Audio API. No audio files needed.
// The AudioContext is primed on the first user gesture (click/keydown/touch)
// so the browser autoplay policy doesn't silence subsequent beeps.

let audioCtx: AudioContext | null = null
let muted = false
let lastPlayedAt = 0

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) {
    try {
      audioCtx = new AC()
    } catch {
      return null
    }
  }
  const ctx = audioCtx
  if (!ctx) return null
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

export function setBeepMuted(v: boolean) {
  muted = v
}
export function isBeepMuted() {
  return muted
}

export function playBeep(
  opts: {
    volume?: number
    freq1?: number
    freq2?: number
    duration?: number
    dedupeMs?: number
  } = {}
) {
  if (muted) return

  const now = Date.now()
  const dedupeMs = opts.dedupeMs ?? 5000
  if (now - lastPlayedAt < dedupeMs) return
  lastPlayedAt = now

  const ctx = getCtx()
  if (!ctx) return

  const volume = opts.volume ?? 0.15
  const freq1 = opts.freq1 ?? 880
  const freq2 = opts.freq2 ?? 660
  const duration = opts.duration ?? 0.22

  const t0 = ctx.currentTime
  const half = duration / 2

  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(i === 0 ? freq1 : freq2, t0 + i * half)

    gain.gain.setValueAtTime(0, t0 + i * half)
    gain.gain.linearRampToValueAtTime(volume, t0 + i * half + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * half + half * 0.9)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(t0 + i * half)
    osc.stop(t0 + i * half + half)
  }
}

// Prime the AudioContext on the first user gesture so the browser
// autoplay policy doesn't block subsequent beeps.
if (typeof window !== 'undefined') {
  const prime = () => {
    getCtx()
    window.removeEventListener('click', prime)
    window.removeEventListener('keydown', prime)
    window.removeEventListener('touchstart', prime)
  }
  window.addEventListener('click', prime, { once: true })
  window.addEventListener('keydown', prime, { once: true })
  window.addEventListener('touchstart', prime, { once: true })
}