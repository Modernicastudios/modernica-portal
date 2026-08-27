import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function SocialAnalyticsLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton h={26} w={220} radius={6} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} rows={2} h={100} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <SkeletonCard rows={6} h={260} />
        <SkeletonCard rows={6} h={260} />
      </div>
    </div>
  )
}
