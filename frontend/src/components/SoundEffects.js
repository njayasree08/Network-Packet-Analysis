// Web Audio API Arcade Sound Synthesizer (Zero external audio file dependency)

class SoundFX {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  toggleMute() {
    this.muted = !this.muted
    return this.muted
  }

  // Laser Pew-Pew Sound
  playLaser() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      const now = this.ctx.currentTime

      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.15)
    } catch (e) {
      console.warn('Audio play error:', e)
    }
  }

  // Boom Explosion Sound
  playBoom() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'square'
      const now = this.ctx.currentTime

      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3)

      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    } catch (e) {
      console.warn('Audio play error:', e)
    }
  }

  // Shield Activate Powerup Sound
  playShield() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      const now = this.ctx.currentTime

      osc.frequency.setValueAtTime(300, now)
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.25)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.25)
    } catch (e) {
      console.warn('Audio play error:', e)
    }
  }

  // Alert Siren
  playSiren() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      const now = this.ctx.currentTime

      osc.frequency.setValueAtTime(600, now)
      osc.frequency.linearRampToValueAtTime(950, now + 0.15)
      osc.frequency.linearRampToValueAtTime(600, now + 0.3)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    } catch (e) {
      console.warn('Audio play error:', e)
    }
  }
}

export const soundFX = new SoundFX()
