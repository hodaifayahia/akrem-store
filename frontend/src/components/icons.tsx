import type { SVGProps } from 'react'

type IconProps = { size?: number; className?: string } & SVGProps<SVGSVGElement>

/** Lucide-style 24×24 stroke icons — inline SVG, no icon dependency. */
function svgProps(size: number, className?: string): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
    focusable: false,
  }
}

export function PhoneIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M11 18h2" />
    </svg>
  )
}

export function CartIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.2l2.3 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L20.5 7H6" />
    </svg>
  )
}

export function SunIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function MoonIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M21 13.2A8.5 8.5 0 0 1 10.8 3a8.5 8.5 0 1 0 10.2 10.2Z" />
    </svg>
  )
}

export function GlobeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  )
}

export function SearchIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}

export function ShieldIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 2.5 4.5 5.5v6c0 4.4 3.1 8.4 7.5 9.9 4.4-1.5 7.5-5.5 7.5-9.9v-6Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  )
}

export function TruckIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 6h10v9H3zM13 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  )
}

export function MapIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

export function StarIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8Z" />
    </svg>
  )
}

export function WhatsappIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3.5 20.5 5 16.6A8 8 0 1 1 8 19.4Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.6-.7-1 1a6.7 6.7 0 0 1-3.2-3.2l1-1L10 8.5c0-.5-.4-1-1-1" />
    </svg>
  )
}

export function FacebookIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M14 8.5h2V5.6h-2a3.4 3.4 0 0 0-3.4 3.4v1.6H8v2.9h2.6V21h2.9v-7.5H16l.4-2.9h-2.9V9.4c0-.5.2-.9.5-.9Z" />
    </svg>
  )
}

export function InstagramIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17 7h.01" />
    </svg>
  )
}

export function MailIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function PlusIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MinusIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function TrashIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 7h16M9.5 7V5h5v2M6.5 7l.8 13h9.4l.8-13" />
    </svg>
  )
}

export function CheckIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  )
}

export function CloseIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function BoltIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6Z" />
    </svg>
  )
}

export function PackageIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  )
}

export function SparkIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  )
}

export function ChevronIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}
