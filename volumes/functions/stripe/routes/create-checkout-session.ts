import type { Context } from 'jsr:@hono/hono'
import { z } from 'npm:zod'
import { stripe, createOrRetrieveCustomer } from '../utils/stripe.ts'

const CreateCheckoutSessionSchema = z.object({
	price: z.object({ id: z.string() }),
	quantity: z.number().optional().default(1),
	metadata: z.record(z.string(), z.any()).optional().default({}),
	success_url: z.url().optional(),
	cancel_url: z.url().optional(),
})

const SITE_URL = Deno.env.get('SITE_URL')

export async function handleCreateCheckoutSession(c: Context) {
  	try {
		const payload = await c.req.json().catch(() => ({}))
		const { price, quantity, metadata, success_url, cancel_url } = CreateCheckoutSessionSchema.parse(payload)

		const user = c.get('user')
		if (!user) return c.json({ error: 'Unauthorized' }, 401)

		const customerId = await createOrRetrieveCustomer(user.id, user.email)

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			billing_address_collection: 'required',
			customer: customerId,
			line_items: [
				{
				price: price.id,
				quantity,
				},
			],
			mode: 'subscription',
			allow_promotion_codes: true,
			subscription_data: {
				trial_period_days: 30,
				metadata,
			},
			success_url: success_url || `${SITE_URL}/settings/subscription`,
			cancel_url: cancel_url || `${SITE_URL}/upgrade`,
		})

		return c.json({ sessionId: session.id })
	} catch (err) {
		console.error(err)
		return c.json({ error: 'Internal Server Error' }, 500)
	}
}
