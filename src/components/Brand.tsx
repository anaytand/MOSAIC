import Logo from './reference/Logo'
interface BrandProps {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <a className={`brand${compact ? ' brand--compact' : ''}`} href="#home" aria-label="MOSAIC home">
      <Logo size={compact ? 26 : 34} />
      <span>MOSAIC</span>
    </a>
  )
}
