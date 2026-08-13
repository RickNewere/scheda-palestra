/** Inline stroke icons, 24x24 grid. */
interface IconProps {
  size?: number
  className?: string
}

function base(size: number | undefined, className: string | undefined) {
  return {
    width: size || 24,
    height: size || 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }
}

export const IconHome = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
  </svg>
)

export const IconHistory = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
    <path d="M12 8v4.5l3 1.8" />
  </svg>
)

export const IconChart = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="m7 15 3.5-4 3 2.5L19 7" />
  </svg>
)

export const IconSettings = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-2.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.6 1.5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4z" />
  </svg>
)

export const IconBack = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M15 18 9 12l6-6" />
  </svg>
)

export const IconPlay = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M7 4.8v14.4a.6.6 0 0 0 .92.5l11.3-7.2a.6.6 0 0 0 0-1L7.92 4.3a.6.6 0 0 0-.92.5z" fill="currentColor" stroke="none" />
  </svg>
)

export const IconCheck = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m5 12.5 4.5 4.5L19 7" strokeWidth={2.4} />
  </svg>
)

export const IconPlus = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconTrash = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
)

export const IconEdit = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
  </svg>
)

export const IconTimer = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2M9 2h6" />
  </svg>
)

export const IconClose = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconUpload = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
)

export const IconChevron = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const IconTrophy = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4v1a4 4 0 0 0 3 3.9M17 6h3v1a4 4 0 0 1-3 3.9M9 20h6M12 14v6" />
  </svg>
)

export const IconFlame = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 3s5 4.2 5 8.5A5 5 0 0 1 7 12c0-1.6.7-2.8 1.6-3.8.3 1.2 1 2 1.9 2.3C10.8 8 12 6.2 12 3z" />
  </svg>
)

export const IconNote = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M5 4h14v16H5z" />
    <path d="M8.5 9h7M8.5 13h7M8.5 17h4" />
  </svg>
)

export const IconSkip = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M6 5v14l9-7z" />
    <path d="M18 5v14" />
  </svg>
)
