import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function ContentLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton h={26} w={200} radius={6} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Skeleton h={38} w={120} radius={8} />
          <Skeleton h={38} w={120} radius={8} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={34} w={90} radius={20} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} rows={4} h={160} />)}
      </div>
    </div>
  )
}
