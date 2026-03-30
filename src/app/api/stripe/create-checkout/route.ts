import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_IDS: Record<string, string> = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
  growth_monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || '',
  growth_yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY || '',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, interval } = await req.json()

  const { data: profile } = await supabase.from('user_profiles').select('agency_id').eq('id', user.id).single()
  const { data: agency } = await supabase.from('agencies').select('*').eq('id', profile?.agency_id).single()

  if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })

  const priceId = PRICE_IDS[`${plan}_${interval}`]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  // Create or get Stripe customer
  let customerId = agency.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: agency.name,
      metadata: { agency_id: agency.id },
    })
    customerId = customer.id
    await supabase.from('agencies').update({ stripe_customer_id: customerId }).eq('id', agency.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    metadata: { agency_id: agency.id, plan },
    subscription_data: { metadata: { agency_id: agency.id, plan } },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
