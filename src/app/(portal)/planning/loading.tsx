import { Skeleton } from '@/components/ui/Skeleton'

export default function PlanningLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton h={26} w={200} radius={6} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Skeleton h={36} w={36} radius={8} />
          <Skeleton h={36} w={160} radius={8} />
          <Skeleton h={36} w={36} radius={8} />
        </div>
      </div>
      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} h={32} radius={4} />)}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 6, padding: 8, minHeight: 80,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <Skeleton h={12} w={20} radius={4} />
            {Math.random() > 0.6 && <Skeleton h={18} w="90%" radius={4} />}
            {Math.random() > 0.75 && <Skeleton h={18} w="80%" radius={4} />}
          </div>
        ))}
      </div>
    </div>
  )
}
