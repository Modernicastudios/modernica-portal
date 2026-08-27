'use client'

// Herbruikbaar skeleton blok — past bij het portal design
export function Skeleton({ w = '100%', h = 16, radius = 8, className = '' }: {
  w?: string | number
  h?: number
  radius?: number
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--border) 25%, var(--card2) 50%, var(--border) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.4s ease infinite',
        flexShrink: 0,
      }}
    />
  )
}

export function SkeletonCard({ rows = 3, h = 110 }: { rows?: number; h?: number }) {
  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      padding: '20px',
      height: h,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <Skeleton h={14} w="55%" />
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <Skeleton key={i} h={12} w={i % 2 === 0 ? '80%' : '65%'} />
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton h={28} w={220} radius={6} />
        <Skeleton h={14} w={340} radius={6} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} rows={2} h={90} />)}
      </div>

      {/* Main content cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <SkeletonCard rows={4} h={180} />
        <SkeletonCard rows={4} h={180} />
      </div>
      <SkeletonCard rows={5} h={200} />
    </div>
  )
}
