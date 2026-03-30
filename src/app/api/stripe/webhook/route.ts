import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_LIMITS: Record<string, object> = {
  starter: { max_clients: 5, max_social_accounts: 10, max_ad_accounts: 2, max_team_members: 3, features: { white_label: false, custom_domain: false } },
  growth: { max_clients: 25, max_social_accounts: 50, max_ad_accounts: 10, max_team_members: 10, features: { white_label: true, custom_domain: false } },
  enterprise: { max_clients: 9999, max_social_accounts: 9999, max_ad_accounts: 9999, max_team_members: 9999, features: { white_label: true, custom_domain: true, hide_powered_by: true } },
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const agencyId = session.metadata?.agency_id
      const plan = session.metadata?.plan || 'starter'
      if (agencyId) {
        await supabase.from('agencies').update({
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          subscription_plan: plan,
          subscription_status: 'active',
          ...(PLAN_LIMITS[plan] || PLAN_LIMITS.starter),
        }).eq('id', agencyId)
      }
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase.from('agencies').update({ subscription_status: 'active' }).eq('stripe_customer_id', invoice.customer)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase.from('agencies').update({ subscription_status: 'past_due' }).eq('stripe_customer_id', invoice.customer)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('agencies').update({ subscription_status: 'canceled', subscription_plan: 'free', ...(PLAN_LIMITS.starter) }).eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
