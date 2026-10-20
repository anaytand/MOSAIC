import { useEffect, useRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { observeMotionRegion } from '../motionActivity'
export function MotionRegion({ as = 'div', children, ...props }: ComponentPropsWithoutRef<'section'> & { as?: 'section' | 'div' }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => ref.current ? observeMotionRegion(ref.current) : undefined, [])
  const Tag = as
  return <Tag {...props} ref={ref as React.Ref<HTMLDivElement>} data-motion-active="false">{children}</Tag>
}
