/** Preserve currentTime when changing speed. Only decorative infinite MOSAIC animations qualify. */
export function motionRate(intensity: number): number {
  const amount = Math.max(0, Math.min(100, intensity)) / 100
  return amount === 0 ? 0 : .04 + .96 * amount ** 2
}
export function applyMotionRates(root: { getAnimations?: (options?: { subtree?: boolean }) => Animation[] }, intensity: number): void {
  for (const animation of root.getAnimations?.({ subtree: true }) ?? []) {
    const name = 'animationName' in animation ? String(animation.animationName) : ''
    if (!name.startsWith('mosaic-') || animation.effect?.getTiming().iterations !== Infinity) continue
    // updatePlaybackRate keeps the animation's position; duration/name never change on slider updates.
    animation.updatePlaybackRate(motionRate(intensity))
  }
}
