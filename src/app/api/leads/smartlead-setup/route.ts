import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCampaignWithSequence, smartleadConfigured, listEmailAccounts, attachEmailAccounts } from '@/lib/leadmachine/smartlead'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Zet een platte-tekst handtekening om naar veilige HTML met KLIKBARE links:
// telefoonnummers (tel:), e-mailadressen (mailto:) en websites (http/www).
function signatureToHtml(raw: string): string {
  let s = escapeHtml(raw.trim())
  // Telefoon: + of 0 gevolgd door 8+ cijfers (spaties/streepjes toegestaan).
  s = s.replace(/(\+?\d[\d\s-]{7,}\d)/g, (m) => `<a href="tel:${m.replace(/[\s-]/g, '')}">${m}</a>`)
  // E-mail.
  s = s.replace(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '<a href="mailto:$1">$1</a>')
  // Website: http(s)://… of www.…
  s = s.replace(/\b(https?:\/\/[^\s<]+|www\.[^\s<]+)/g, (m) => {
    const href = m.startsWith('http') ? m : `https://${m}`
    return `<a href="${href}">${m}</a>`
  })
  return s.replace(/\n/g, '<br>')
}

// Bouwt onderwerp + e-mailtekst per dienst. Toon: altijd positief, nooit
// afbranden, met gratis advies/offerte als haakje en een zachte open afsluiter.
// `signatureHtml` is al veilige HTML (incl. klikbare links) of null.
function buildTemplate(service: string, agencyName: string, signatureHtml?: string | null): { subject: string; htmlBody: string } {
  const sign = signatureHtml
    ? `<p>${signatureHtml}</p>`
    : `<p>Groet,<br>${agencyName}</p>`
  if (service === 'website') {
    return {
      subject: 'Een frisse blik op de site van {{company_name}}?',
      htmlBody: [
        '<p>Hi {{first_name}},</p>',
        '<p>{{opening_line}}</p>',
        `<p>Wij van ${agencyName} maken websites die fijn werken én er strak uitzien. Wat er bij {{company_name}} staat ziet er al goed uit — we denken dat het op punten misschien nóg frisser of moderner kan.</p>`,
        '<p>Wil je daar vrijblijvend eens over sparren? We geven je graag <strong>gratis advies</strong>, of stellen desgewenst een <strong>offerte op maat</strong> op. Geheel vrijblijvend — gewoon kijken of het je aanspreekt.</p>',
        '<p>Lijkt het je wat? Laat het me even weten, dan denk ik graag met je mee.</p>',
        sign,
      ].join(''),
    }
  }
  return {
    subject: 'Een idee voor {{company_name}}, {{first_name}}',
    htmlBody: [
      '<p>Hi {{first_name}},</p>',
      '<p>{{opening_line}}</p>',
      `<p>Wij van ${agencyName} helpen bedrijven aan meer klanten met slimme marketing. Wat jullie nu doen ziet er al goed uit — we denken dat er op punten misschien nog iets moois bij kan.</p>`,
      '<p>Wil je daar vrijblijvend over sparren? We geven je graag <strong>gratis advies</strong>, of stellen desgewenst een <strong>offerte op maat</strong> op — geheel vrijblijvend.</p>',
      '<p>Lijkt het je wat? Laat het me even weten, dan denk ik graag met je mee.</p>',
      sign,
    ].join(''),
  }
}

export const maxDuration = 30

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

// Maakt vanuit de app een Smartlead-campagne + sjabloon aan en slaat het
// campagne-ID automatisch op bij de juiste leadcampagne. Daarna hoeft de
// gebruiker in Smartlead alleen nog z'n inboxen te koppelen en op 'aan' te zetten.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('agency_id, role').eq('id', user.id).single()
  if (!profile?.agency_id) return NextResponse.json({ error: 'Geen agency' }, { status: 403 })
  if (!MANAGER_ROLES.has(profile.role) && user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Geen rechten' }, { status: 403 })
  }
  if (!smartleadConfigured()) {
    return NextResponse.json({ error: 'Smartlead is nog niet ingesteld (SMARTLEAD_API_KEY).' }, { status: 400 })
  }

  const { campaignId } = await req.json()
  const { data: campaign } = await admin
    .from('lead_campaigns').select('id, agency_id, client_id, settings').eq('id', campaignId).single()
  if (!campaign || campaign.agency_id !== profile.agency_id) {
    return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
  }

  const settings = (campaign.settings as Record<string, unknown> | null) || {}
  // Al gekoppeld? Dan niet nog een keer aanmaken.
  if (settings.smartlead_campaign_id) {
    return NextResponse.json({ ok: true, smartleadCampaignId: settings.smartlead_campaign_id, alreadyLinked: true })
  }

  // Naam + ondertekening op basis van agency / klant.
  const { data: agency } = await admin.from('agencies').select('name').eq('id', profile.agency_id).single()
  const agencyName = agency?.name || 'Onze agency'
  let label = 'Eigen marketing'
  if (campaign.client_id) {
    const { data: client } = await admin.from('clients').select('company_name').eq('id', campaign.client_id).single()
    label = client?.company_name || 'Klant'
  }
  const name = `${agencyName} – ${label} (leadmachine)`
  const service = String(settings.service || 'website')

  // Handtekening: eerst de agency-brede (één keer ingesteld), anders een
  // eventuele per-campagne handtekening. Links worden klikbaar gemaakt.
  const { data: brandKit } = await admin
    .from('brand_kits').select('email_signature').eq('agency_id', profile.agency_id).single()
  const rawSignature = (typeof brandKit?.email_signature === 'string' && brandKit.email_signature.trim())
    ? brandKit.email_signature
    : (typeof settings.signature === 'string' ? settings.signature : null)
  const signatureHtml = rawSignature ? signatureToHtml(rawSignature) : null
  const { subject, htmlBody } = buildTemplate(service, agencyName, signatureHtml)

  const result = await createCampaignWithSequence({ name, subject, htmlBody })
  if (!result.ok || !result.campaignId) {
    return NextResponse.json({ error: result.error || 'Aanmaken mislukt' }, { status: 502 })
  }

  // Campagne-ID opslaan bij onze leadcampagne (merge in settings).
  const newSettings = { ...settings, smartlead_campaign_id: result.campaignId }
  await admin.from('lead_campaigns').update({ settings: newSettings, updated_at: new Date().toISOString() }).eq('id', campaign.id)

  // Alle inboxen automatisch aan de campagne koppelen (mogen door meerdere
  // campagnes gedeeld worden). Lukt dit niet, dan blijft de campagne wel staan.
  let attached = 0
  let attachWarning: string | null = null
  const accounts = await listEmailAccounts()
  if (accounts.ok && accounts.ids.length > 0) {
    const att = await attachEmailAccounts(result.campaignId, accounts.ids)
    if (att.ok) attached = accounts.ids.length
    else attachWarning = att.error || 'Inboxen koppelen mislukte'
  } else if (accounts.error) {
    attachWarning = accounts.error
  }

  return NextResponse.json({
    ok: true,
    smartleadCampaignId: result.campaignId,
    attached,
    warning: result.error || attachWarning || null,
  })
}
