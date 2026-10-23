// frontend/src/utils/beep.ts
//
// Notification beep via a real audio file loaded from
// src/assets/notification_sound.mp3. Vite resolves the import to a
// hashed, cache-busted URL — no manual path juggling.
//
// The AudioContext is primed on the first user gesture (click/keydown/touch)
// so the browser autoplay policy doesn't silence subsequent beeps, and the
// mp3 is pre-fetched + decoded on the same gesture so the first beep has
// no decode latency.

import beepFile from "@/assets/notification_sound.mp3";

let audioCtx: AudioContext | null = null
let audioBuffer: AudioBuffer | null = null
let loadingPromise: Promise<void> | null = null
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


























// Fetch + decode the mp3 once; cache the resulting AudioBuffer.
const ensureBuffer = async (): Promise<AudioBuffer | null> => {
  const ctx = getCtx()
  if (!ctx) return null
  if (audioBuffer) return audioBuffer

  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        console.log("[beep] loading sound file:", beepFile)     
        const res = await fetch(beepFile)
        if (!res.ok) {
          console.error(
            `[beep] fetch failed — HTTP ${res.status} for ${beepFile}`
          )
          audioBuffer = null
          return
        }
        const arr = await res.arrayBuffer()
        audioBuffer = await ctx.decodeAudioData(arr)
        console.log(                                        
          `[beep] decoded ok — duration ${audioBuffer.duration.toFixed(3)}s`
        )
      } catch (err) {
        console.error("[beep] failed to load/decode sound:", err)
        audioBuffer = null
      }
    })()
  }
  await loadingPromise
  return audioBuffer
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
    dedupeMs?: number
    // kept for backward compatibility — ignored now that we use a file
    freq1?: number
    freq2?: number
    duration?: number
  } = {}
) {
  console.log("[playBeep] FIRED", opts);                          
  if (muted) {
    console.log("[playBeep] MUTED — returning");                 
    return
  }

  const now = Date.now()
  const dedupeMs = opts.dedupeMs ?? 5000
  if (now - lastPlayedAt < dedupeMs) {
    console.log(                                              
      `[playBeep] DEDUPED — ${now - lastPlayedAt}ms < ${dedupeMs}ms`
    );
    return
  }
  lastPlayedAt = now;

  // Fire-and-forget: kick off load (if needed), then play.
  (async () => {
    const ctx = getCtx()
    if (!ctx) {
      console.log("[playBeep] NO AUDIOCONTEXT");                   
      return
    }

    const buf = await ensureBuffer()
    if (!buf) {
      console.log("[playBeep] NO BUFFER — sound file missing or undecodable")  // ✅ ADDED
      return
    }

    const src = ctx.createBufferSource()
    src.buffer = buf

    const gain = ctx.createGain()
    gain.gain.value = opts.volume ?? 0.5

    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()

    console.log("[playBeep] file playing");                         // ✅ ADDED
  })()
}

// Prime the AudioContext AND pre-load the mp3 on the first user gesture
// so the very first beep has no decode latency.
if (typeof window !== 'undefined') {
  const prime = () => {
    getCtx()
    ensureBuffer().catch(() => {})
    window.removeEventListener('click', prime)
    window.removeEventListener('keydown', prime)
    window.removeEventListener('touchstart', prime)
  }
  window.addEventListener('click', prime, { once: true })
  window.addEventListener('keydown', prime, { once: true })
  window.addEventListener('touchstart', prime, { once: true })
}