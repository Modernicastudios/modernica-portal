import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  try {
    const { postId } = await req.json()

    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .select('*, agency:agencies(id)')
      .eq('id', postId)
      .single()

    if (error || !post) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 })

    await supabase.from('scheduled_posts').update({ status: 'publishing' }).eq('id', postId)

    const platformResults: Record<string, string> = {}
    const errors: string[] = []

    for (const target of post.platforms) {
      try {
        const { data: account } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('id', target.account_id)
          .single()

        if (!account) { errors.push(`Account ${target.account_id} not found`); continue }

        let postId_platform = ''

        switch (account.platform) {
          case 'instagram':
            postId_platform = await publishToInstagram(account.access_token, account.platform_account_id, post)
            break
          case 'facebook':
            postId_platform = await publishToFacebook(account.access_token, account.platform_account_id, post)
            break
          case 'linkedin':
            postId_platform = await publishToLinkedIn(account.access_token, account.platform_account_id, post)
            break
          case 'tiktok':
            postId_platform = await publishToTikTok(account.access_token, post)
            break
        }

        if (postId_platform) platformResults[account.platform] = postId_platform
      } catch (err: any) {
        errors.push(`${target.platform}: ${err.message}`)
      }
    }

    await supabase.from('scheduled_posts').update({
      status: errors.length === post.platforms.length ? 'failed' : 'published',
      published_at: new Date().toISOString(),
      platform_post_ids: platformResults,
      error_message: errors.length > 0 ? errors.join('; ') : null,
    }).eq('id', postId)

    return new Response(JSON.stringify({ success: true, results: platformResults, errors }))
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

async function publishToInstagram(token: string, igUserId: string, post: any): Promise<string> {
  if (post.media_urls?.length > 0) {
    // Create media container
    const containerResp = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: post.media_urls[0],
          caption: post.content_text,
          access_token: token,
        }),
      }
    )
    const container = await containerResp.json()
    if (!container.id) throw new Error(`Instagram container error: ${JSON.stringify(container)}`)

    // Wait for processing
    await new Promise(r => setTimeout(r, 3000))

    // Publish
    const publishResp = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: token }),
      }
    )
    const result = await publishResp.json()
    return result.id || ''
  } else {
    throw new Error('Instagram requires media to post')
  }
}

async function publishToFacebook(token: string, pageId: string, post: any): Promise<string> {
  const body: any = { message: post.content_text, access_token: token }
  if (post.media_urls?.length > 0) body.url = post.media_urls[0]

  const resp = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await resp.json()
  if (result.error) throw new Error(result.error.message)
  return result.id || ''
}

async function publishToLinkedIn(token: string, authorId: string, post: any): Promise<string> {
  const body: any = {
    author: `urn:li:person:${authorId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: post.content_text },
        shareMediaCategory: post.media_urls?.length > 0 ? 'IMAGE' : 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }

  const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify(body),
  })
  const result = await resp.json()
  if (result.status >= 400) throw new Error(result.message || 'LinkedIn publish failed')
  return result.id || ''
}

async function publishToTikTok(token: string, post: any): Promise<string> {
  if (!post.media_urls?.[0]) throw new Error('TikTok requires a video')

  const resp = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post_info: { title: post.content_text?.slice(0, 150) || '', privacy_level: 'PUBLIC_TO_EVERYONE', disable_duet: false, disable_comment: false, disable_stitch: false },
      source_info: { source: 'PULL_FROM_URL', video_url: post.media_urls[0] },
    }),
  })
  const result = await resp.json()
  return result.data?.publish_id || ''
}
