import { applyMotionRates } from './motionPlayback.ts'
/** Pauses decorative CSS animation offscreen or in a hidden tab. No frame loop or React state. */
export interface MotionVisibility {
  hidden: boolean
  addEventListener: (name: 'visibilitychange', callback: () => void) => void
  removeEventListener: (name: 'visibilitychange', callback: () => void) => void
}
export interface MotionObserver { observe: (element: Element) => void; disconnect: () => void }
export function observeMotionRegion(
  element: Element & { dataset: DOMStringMap },
  visibility: MotionVisibility = document,
  createObserver: ((callback: (visible: boolean) => void) => MotionObserver) | undefined = typeof IntersectionObserver === 'undefined' ? undefined : (callback) => new IntersectionObserver((entries) => callback(entries.some((entry) => entry.isIntersecting)), { threshold: .01 }),
): () => void {
  let visible = false
  let disposed = false
  const publish = () => { if (!disposed) { element.dataset.motionActive = String(visible && !visibility.hidden); if (visible && !visibility.hidden && typeof document !== 'undefined') applyMotionRates(element, Number(document.documentElement.dataset.motionLevel ?? 0)) } }
  const observer = createObserver?.((next) => { visible = next; publish() })
  // Browsers without IntersectionObserver get the complete static artwork.
  publish()
  observer?.observe(element)
  visibility.addEventListener('visibilitychange', publish)
  return () => {
    disposed = true
    observer?.disconnect()
    visibility.removeEventListener('visibilitychange', publish)
    element.dataset.motionActive = 'false'
  }
}
