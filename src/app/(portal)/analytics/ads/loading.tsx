import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function AdsLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton h={26} w={200} radius={6} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} rows={2} h={100} />)}
      </div>
      <SkeletonCard rows={6} h={300} />
      <SkeletonCard rows={4} h={200} />
    </div>
  )
}
