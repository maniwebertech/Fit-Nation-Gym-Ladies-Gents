import type { Member } from '@/types'

function MaleAvatar() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="rgba(27,63,204,0.18)" />
      <circle cx="40" cy="28" r="14" fill="rgba(107,143,255,0.6)" />
      <ellipse cx="40" cy="62" rx="22" ry="14" fill="rgba(107,143,255,0.4)" />
    </svg>
  )
}

function FemaleAvatar() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="rgba(255,100,180,0.15)" />
      <circle cx="40" cy="28" r="14" fill="rgba(255,100,180,0.6)" />
      <ellipse cx="40" cy="62" rx="22" ry="14" fill="rgba(255,100,180,0.35)" />
      <path d="M22 30 Q22 12 40 12 Q58 12 58 30" fill="rgba(255,100,180,0.22)" />
    </svg>
  )
}

interface Props {
  member: Pick<Member, 'profile_image_url' | 'gender' | 'full_name'>
  size?: number
  style?: React.CSSProperties
}

export default function MemberAvatar({ member, size = 36, style }: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1.5px solid var(--border)',
        background: 'var(--bg-card2)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {member.profile_image_url ? (
        <img
          src={member.profile_image_url}
          alt={member.full_name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : member.gender === 'Male' ? (
        <MaleAvatar />
      ) : (
        <FemaleAvatar />
      )}
    </div>
  )
}
