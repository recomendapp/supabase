import Stripe from 'npm:stripe@19.1.0';
import { supabaseAdmin } from '../supabase.ts';

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-09-30.clover',
})

export const createOrRetrieveCustomer = async (uuid: string, email?: string) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', uuid)
    .single()

  if (error || !data?.stripe_customer_id) {
    const customer = await stripe.customers.create({
      email,
      metadata: { supabaseUUID: uuid },
    })
    await supabaseAdmin.from('customers').insert([{ id: uuid, stripe_customer_id: customer.id }])
    return customer.id
  }
  return data.stripe_customer_id
}
