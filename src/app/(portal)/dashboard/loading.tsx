import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton h={26} w={260} radius={6} />
        <Skeleton h={13} w={180} radius={6} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} rows={2} h={88} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <SkeletonCard rows={5} h={200} />
        <SkeletonCard rows={5} h={200} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <SkeletonCard rows={6} h={240} />
        <SkeletonCard rows={4} h={240} />
      </div>
    </div>
  )
}
