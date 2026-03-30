import ReviewClient from './ReviewClient'

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <ReviewClient token={token} />
}
