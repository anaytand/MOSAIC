interface BrandProps {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <a className={`brand${compact ? ' brand--compact' : ''}`} href="#home" aria-label="MOSAIC home">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>MOSAIC</span>
    </a>
  )
}
