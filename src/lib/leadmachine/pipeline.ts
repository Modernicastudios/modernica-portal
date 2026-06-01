// Leadmachine-pijplijn. Draait server-side (service-role) per campagne:
// bedrijven vinden -> contactpersoon + e-mail -> AI-openingszin -> verificatie.
// Externe sleutels komen uit de omgeving (Vercel env vars).
import { createAdminClient } from '@/lib/supabase/admin'

const APIFY_TOKEN = process.env.APIFY_TOKEN || ''
const APIFY_MAPS_ACTOR = process.env.APIFY_MAPS_ACTOR || 'compass~crawler-google-places'
const APOLLO_API_KEY = process.env.APOLLO_API_KEY || ''
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
const MILLIONVERIFIER_API_KEY = process.env.MILLIONVERIFIER_API_KEY || ''

export type RunSummary = {
  found: number
  withContact: number
  withEmail: number
  withOpeningLine: number
  errors: string[]
}

type RawCompany = {
  name: string
  domain: string | null
  website_url: string | null
  phone: string | null
  address: string | null
  city: string | null
}

// ── 1. Ingestion: bedrijven via Apify (Google Maps) ──────────────────────────
async function ingestCompanies(keyword: string, region: string, limit: number): Promise<RawCompany[]> {
  if (!APIFY_TOKEN) throw new Error('APIFY_TOKEN ontbreekt')
  const url = `https://api.apify.com/v2/acts/${APIFY_MAPS_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: [keyword || 'bedrijf'],
      locationQuery: region,
      maxCrawledPlacesPerSearch: limit,
      language: 'nl',
    }),
  })
  if (!res.ok) throw new Error(`Apify gaf ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const items: any[] = await res.json()
  return items.slice(0, limit).map((it) => {
    const website: string | null = it.website || null
    let domain: string | null = null
    try { if (website) domain = new URL(website).hostname.replace(/^www\./, '') } catch { /* geen geldige url */ }
    return {
      name: it.title || it.name || 'Onbekend',
      domain,
      website_url: website,
      phone: it.phone || it.phoneUnformatted || null,
      address: it.street || it.address || null,
      city: it.city || region,
    }
  })
}

// ── 2. Enrichment: contactpersoon + e-mail via Apollo, anders patroon-gok ─────
type Contact = { full_name: string | null; role: string | null; email: string | null; found_via: 'apollo' | 'pattern' | null; confidence: number }

async function enrichContact(company: RawCompany): Promise<Contact | null> {
  if (!company.domain) return null
  // Apollo first
  if (APOLLO_API_KEY) {
    try {
      const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'X-Api-Key': APOLLO_API_KEY },
        body: JSON.stringify({
          q_organization_domains: company.domain,
          person_titles: ['owner', 'founder', 'eigenaar', 'ceo', 'marketing manager', 'director'],
          page: 1,
          per_page: 1,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const p = data.people?.[0]
        if (p) {
          const email: string | null = p.email && !/not_unlocked|email_not/i.test(p.email) ? p.email : null
          const fullName = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || null
          if (email) return { full_name: fullName, role: p.title || null, email, found_via: 'apollo', confidence: 90 }
          // Apollo kende de persoon maar mailde gemaskeerd -> patroon-gok op voornaam
          if (p.first_name) return { full_name: fullName, role: p.title || null, email: `${p.first_name.toLowerCase()}@${company.domain}`, found_via: 'pattern', confidence: 55 }
        }
      }
    } catch { /* val terug op patroon */ }
  }
  // Patroon-gok (NL-MKB: info@ als laatste redmiddel)
  return { full_name: null, role: null, email: `info@${company.domain}`, found_via: 'pattern', confidence: 35 }
}

// ── 3. Personalisatie: AI schrijft een openingszin ───────────────────────────
async function writeOpeningLine(company: RawCompany, contact: Contact): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null
  const prompt = `Je schrijft de openingszin van een koude wervingsmail namens Modernica Studios, een creatief/marketingbureau (websites, social media, advertenties, video).
Bedrijf: ${company.name}${company.city ? `, ${company.city}` : ''}${company.website_url ? `, site: ${company.website_url}` : ''}.
Contactpersoon: ${contact.full_name || 'onbekend'}.
Schrijf één natuurlijke, persoonlijke openingszin in het Nederlands (max 25 woorden) die concreet naar dit bedrijf verwijst. Geen begroeting, geen clichés, geen aanhalingstekens. Alleen die ene zin.`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 200, messages: [{ role: 'user', content: prompt }] }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.content?.[0]?.text || '').trim() || null
  } catch { return null }
}

// ── 4. Verificatie: e-mail checken via MillionVerifier ───────────────────────
async function verifyEmail(email: string): Promise<'valid' | 'risky' | 'invalid' | null> {
  if (!MILLIONVERIFIER_API_KEY) return null
  try {
    const res = await fetch(`https://api.millionverifier.com/api/v3/?api=${MILLIONVERIFIER_API_KEY}&email=${encodeURIComponent(email)}&timeout=10`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.result === 'ok') return 'valid'
    if (data.result === 'catch_all' || data.result === 'unknown') return 'risky'
    return 'invalid'
  } catch { return null }
}

// ── Orchestratie: draai één campagne voor een batch bedrijven ────────────────
export async function runCampaign(campaignId: string, limit = 5): Promise<RunSummary> {
  const admin = createAdminClient()
  const summary: RunSummary = { found: 0, withContact: 0, withEmail: 0, withOpeningLine: 0, errors: [] }

  const { data: campaign, error } = await admin
    .from('lead_campaigns').select('*').eq('id', campaignId).single()
  if (error || !campaign) throw new Error('Campagne niet gevonden')

  const keyword = campaign.sbi_code || 'bedrijf'
  const region = campaign.region || ''
  const raws = await ingestCompanies(keyword, region, limit)
  summary.found = raws.length

  for (const raw of raws) {
    try {
      const { data: company } = await admin.from('lead_companies').upsert({
        agency_id: campaign.agency_id,
        client_id: campaign.client_id,
        campaign_id: campaign.id,
        name: raw.name,
        domain: raw.domain,
        website_url: raw.website_url,
        phone: raw.phone,
        address: raw.address,
        city: raw.city,
        source: 'apify',
      }, { onConflict: 'agency_id,kvk_number', ignoreDuplicates: false }).select('id').single()
      if (!company) continue

      const contact = await enrichContact(raw)
      if (contact) {
        summary.withContact++
        let verified: 'valid' | 'risky' | 'invalid' | null = null
        if (contact.email) { summary.withEmail++; verified = await verifyEmail(contact.email) }
        const { data: savedContact } = await admin.from('lead_contacts').insert({
          agency_id: campaign.agency_id, client_id: campaign.client_id, company_id: company.id,
          full_name: contact.full_name, role: contact.role, email: contact.email,
          found_via: contact.found_via, confidence: contact.confidence, email_verified: verified,
        }).select('id').single()

        const opening = await writeOpeningLine(raw, contact)
        if (opening) summary.withOpeningLine++
        await admin.from('lead_outreach').insert({
          agency_id: campaign.agency_id, client_id: campaign.client_id, company_id: company.id,
          contact_id: savedContact?.id || null, is_primary: true,
          opening_line: opening, status: 'queued',
        })
      }
    } catch (e) {
      summary.errors.push(raw.name + ': ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return summary
}
