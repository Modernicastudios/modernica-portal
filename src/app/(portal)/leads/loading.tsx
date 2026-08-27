import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function LeadsLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton h={26} w={180} radius={6} />
          <Skeleton h={13} w={280} radius={6} />
        </div>
        <Skeleton h={38} w={140} radius={8} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[1, 2, 3, 4].map(i => <Skeleton key={i} h={34} w={100} radius={20} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px 20px',
            display: 'flex', gap: 16, alignItems: 'center',
          }}>
            <Skeleton h={40} w={40} radius={999} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton h={14} w="40%" />
              <Skeleton h={12} w="60%" />
            </div>
            <Skeleton h={24} w={80} radius={20} />
          </div>
        ))}
      </div>
    </div>
  )
}
