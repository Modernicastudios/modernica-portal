import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role to bypass RLS for public token lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data, error } = await supabaseAdmin
    .from('content_posts')
    .select('id, title, platform, content_type, caption, hashtags, notes, scheduled_at, status, share_token, clients(company_name), agencies(name, logo_url)')
    .eq('share_token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json()
  const { decision, feedback_note, reviewer_name } = body

  // Look up the post
  const { data: post } = await supabaseAdmin
    .from('content_posts')
    .select('id, agency_id')
    .eq('share_token', token)
    .single()

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Record feedback
  await supabaseAdmin.from('approval_feedback').insert({
    post_id: post.id,
    share_token: token,
    decision,
    feedback_note,
    reviewer_name,
  })

  // Update post status
  const newStatus = decision === 'approved' ? 'scheduled' : 'concept'
  const updateData: Record<string, string> = { status: newStatus }
  if (decision === 'changes_requested' && feedback_note) {
    updateData.rejection_note = feedback_note
  }
  await supabaseAdmin.from('content_posts').update(updateData).eq('id', post.id)

  return NextResponse.json({ success: true })
}
