import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function ProjectsLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton h={26} w={180} radius={6} />
        <Skeleton h={38} w={140} radius={8} />
      </div>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
        {[1, 2, 3, 4].map(col => (
          <div key={col} style={{ minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton h={20} w={120} radius={6} />
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} rows={3} h={110} />)}
          </div>
        ))}
      </div>
    </div>
  )
}
