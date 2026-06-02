import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const BILLING_ROLES = new Set(['admin', 'super_admin'])

export async function POST(req: NextRequest) {
  try {
    const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('user_profiles').select('agency_id, role').eq('id', user.id).single()
    // Alleen beheerders mogen bij het abonnement (opzeggen/wijzigen).
    if (!profile?.role || !BILLING_ROLES.has(profile.role)) {
      return NextResponse.json({ error: 'Geen rechten' }, { status: 403 })
    }
    const { data: agency } = await supabase.from('agencies').select('stripe_customer_id').eq('id', profile.agency_id).single()

    if (!agency?.stripe_customer_id) return NextResponse.json({ error: 'No Stripe customer' }, { status: 404 })

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: agency.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch {
    return NextResponse.json({ error: 'Kon het abonnementsportaal niet openen.' }, { status: 500 })
  }
}
