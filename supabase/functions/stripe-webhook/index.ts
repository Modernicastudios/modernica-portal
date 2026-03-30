import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const PLAN_LIMITS: Record<string, { max_clients: number; max_social_accounts: number; max_ad_accounts: number; max_team_members: number; features: object }> = {
  starter: { max_clients: 5, max_social_accounts: 10, max_ad_accounts: 2, max_team_members: 3, features: { white_label: false, custom_domain: false } },
  growth: { max_clients: 25, max_social_accounts: 50, max_ad_accounts: 10, max_team_members: 10, features: { white_label: true, custom_domain: false } },
  enterprise: { max_clients: 9999, max_social_accounts: 9999, max_ad_accounts: 9999, max_team_members: 9999, features: { white_label: true, custom_domain: true, hide_powered_by: true } },
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err: any) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const agencyId = session.metadata?.agency_id
      const plan = session.metadata?.plan || 'starter'

      if (agencyId) {
        await supabase.from('agencies').update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_plan: plan,
          subscription_status: 'active',
          ...PLAN_LIMITS[plan],
        }).eq('id', agencyId)
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase.from('agencies')
        .update({ subscription_status: 'active' })
        .eq('stripe_customer_id', invoice.customer as string)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase.from('agencies')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const plan = sub.metadata?.plan || 'starter'
      await supabase.from('agencies').update({
        subscription_plan: plan,
        subscription_status: sub.status as string,
        ...PLAN_LIMITS[plan] || PLAN_LIMITS.starter,
      }).eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('agencies').update({
        subscription_status: 'canceled',
        subscription_plan: 'free',
        ...PLAN_LIMITS.starter,
      }).eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
