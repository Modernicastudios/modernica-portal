import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function ClientsLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton h={26} w={160} radius={6} />
        <Skeleton h={38} w={140} radius={8} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} rows={3} h={120} />)}
      </div>
    </div>
  )
}
