import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface EmailPayload {
  to: string
  subject: string
  html: string
  from?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { to, subject, html, from, type, data } = await req.json()

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
    const FROM_EMAIL = from || Deno.env.get('FROM_EMAIL') || 'noreply@modernicaportal.com'

    let emailHtml = html
    let emailSubject = subject

    // Pre-built email templates
    if (type === 'invitation') {
      const inviteUrl = `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/accept-invitation?token=${data.token}`
      emailSubject = `Je bent uitgenodigd voor ${data.agencyName}`
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4ff; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(26,63,228,.1);">
            <div style="background: #1a3fe4; padding: 32px; text-align: center;">
              <h1 style="color: #fff; font-size: 1.4rem; margin: 0;">${data.agencyName}</h1>
              <p style="color: rgba(255,255,255,.7); margin: 8px 0 0; font-size: .9rem;">Klantportaal</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 1.2rem; margin-bottom: 16px;">Je bent uitgenodigd! 🎉</h2>
              <p style="color: #6b78a8; line-height: 1.6;">
                ${data.inviterName} van <strong>${data.agencyName}</strong> heeft je uitgenodigd om toegang te krijgen tot het klantportaal voor <strong>${data.clientName}</strong>.
              </p>
              <p style="color: #6b78a8; line-height: 1.6;">
                Via het portaal kun je projecten volgen, taken bekijken, berichten sturen en de voortgang van jouw marketing inzien.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: #1a3fe4; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1rem;">
                  Uitnodiging accepteren →
                </a>
              </div>
              <p style="color: #aab; font-size: .8rem; text-align: center;">
                Deze link is 7 dagen geldig. Heb je deze e-mail niet verwacht? Je kunt hem veilig negeren.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    } else if (type === 'task_assigned') {
      emailSubject = `Nieuwe taak toegewezen: ${data.taskTitle}`
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4ff; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(26,63,228,.1);">
            <div style="background: #1a3fe4; padding: 24px 32px;">
              <h1 style="color: #fff; font-size: 1.1rem; margin: 0;">📋 Nieuwe taak toegewezen</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 1.1rem; margin-bottom: 8px;">${data.taskTitle}</h2>
              <p style="color: #6b78a8;">${data.taskDescription || 'Geen beschrijving.'}</p>
              ${data.dueDate ? `<p style="margin-top: 12px;"><strong>Deadline:</strong> ${new Date(data.dueDate).toLocaleDateString('nl-NL')}</p>` : ''}
              <div style="text-align: center; margin: 28px 0;">
                <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL')}/projects" style="display: inline-block; background: #1a3fe4; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">
                  Taak bekijken →
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    } else if (type === 'post_published') {
      emailSubject = `✅ Post gepubliceerd op ${data.platforms?.join(', ')}`
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4ff; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden;">
            <div style="background: #00b89c; padding: 24px 32px;">
              <h1 style="color: #fff; font-size: 1.1rem; margin: 0;">✅ Post succesvol gepubliceerd</h1>
            </div>
            <div style="padding: 32px;">
              <p style="color: #6b78a8;">Jouw post is gepubliceerd op: <strong>${data.platforms?.join(', ')}</strong></p>
              ${data.caption ? `<blockquote style="border-left: 3px solid #1a3fe4; padding-left: 16px; color: #333; margin: 16px 0;">${data.caption.substring(0, 200)}${data.caption.length > 200 ? '...' : ''}</blockquote>` : ''}
              <div style="text-align: center; margin-top: 24px;">
                <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL')}/content" style="display: inline-block; background: #1a3fe4; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">
                  Content kalender →
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    if (!resp.ok) {
      const error = await resp.json()
      throw new Error(`Resend error: ${JSON.stringify(error)}`)
    }

    const result = await resp.json()
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
