interface TimerDriver {
  set: (callback: () => void, delayMs: number) => number
  clear: (timer: number) => void
}

/** One pending playback tick at a time. Cancel on pause, replay, prop change, or unmount. */
export function createPlaybackClock(driver: TimerDriver = {
  set: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clear: (timer) => window.clearTimeout(timer),
}) {
  let pending: number | null = null
  return {
    schedule(callback: () => void, delayMs: number) {
      if (pending !== null) driver.clear(pending)
      pending = driver.set(() => { pending = null; callback() }, delayMs)
    },
    cancel() {
      if (pending !== null) driver.clear(pending)
      pending = null
    },
  }
}
