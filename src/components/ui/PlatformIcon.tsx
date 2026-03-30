import {
  SiInstagram,
  SiTiktok,
  SiYoutube,
  SiFacebook,
  SiX,
  SiThreads,
  SiPinterest,
  SiSnapchat,
  SiGoogle,
} from 'react-icons/si'
import { FaLinkedinIn } from 'react-icons/fa'

export const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#e1306c',
  tiktok: '#010101',
  linkedin: '#0077b5',
  youtube: '#ff0000',
  facebook: '#1877f2',
  x: '#000000',
  twitter: '#000000',
  threads: '#000000',
  pinterest: '#e60023',
  snapchat: '#fffc00',
  google: '#4285f4',
}

export const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  facebook: 'Facebook',
  x: 'X',
  twitter: 'X',
  threads: 'Threads',
  pinterest: 'Pinterest',
  snapchat: 'Snapchat',
  google: 'Google',
}

interface PlatformIconProps {
  platform: string
  size?: number
  color?: string
}

export function PlatformIcon({ platform, size = 16, color }: PlatformIconProps) {
  const p = platform?.toLowerCase()
  const iconColor = color || PLATFORM_COLORS[p] || '#6b7280'
  const props = { size, color: iconColor }

  switch (p) {
    case 'instagram':  return <SiInstagram {...props} />
    case 'tiktok':     return <SiTiktok {...props} />
    case 'linkedin':   return <FaLinkedinIn {...props} />
    case 'youtube':    return <SiYoutube {...props} />
    case 'facebook':   return <SiFacebook {...props} />
    case 'x':
    case 'twitter':    return <SiX {...props} />
    case 'threads':    return <SiThreads {...props} />
    case 'pinterest':  return <SiPinterest {...props} />
    case 'snapchat':   return <SiSnapchat {...props} />
    case 'google':     return <SiGoogle {...props} />
    default:           return (
      <span style={{
        width: size, height: size, borderRadius: '50%',
        background: iconColor, display: 'inline-block', flexShrink: 0,
      }} />
    )
  }
}

// Badge component: icon + label in a pill
interface PlatformBadgeProps {
  platform: string
  size?: number
  showLabel?: boolean
}

export function PlatformBadge({ platform, size = 13, showLabel = true }: PlatformBadgeProps) {
  const p = platform?.toLowerCase()
  const color = PLATFORM_COLORS[p] || '#6b7280'
  const label = PLATFORM_LABELS[p] || platform

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: '50px',
      padding: '3px 8px',
      fontSize: '.72rem', fontWeight: 600, color,
      whiteSpace: 'nowrap',
    }}>
      <PlatformIcon platform={p} size={size} color={color} />
      {showLabel && label}
    </span>
  )
}
