import type { Context } from 'jsr:@hono/hono'
import Stripe from 'npm:stripe@19.1.0';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

export const handleWebhook = async (c: Context) => {
	const body = await c.req.text()
	const sig = c.req.header('Stripe-Signature') || ''
	
	if (!sig || !STRIPE_WEBHOOK_SECRET) {
		return c.json({ error: 'Missing signature or webhook secret' }, 400)
	}

	let event: Stripe.Event
	try {
		event = Stripe.webhooks.constructEvent(
			body,
			sig,
			STRIPE_WEBHOOK_SECRET
		)
	} catch (err) {
		if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
			console.error('⚠️  Webhook signature verification failed.', err.message)
		}
		return c.json({ error: 'Webhook signature verification failed' }, 400)
	}

	if (!relevantEvents.has(event.type)) {
		return c.json({ error: 'Event type not relevant' }, 400)
	}

	try {
		switch (event.type) {
			case 'product.created':
			case 'product.updated':
				// Handle product creation and updates
				break;
			case 'product.deleted':
				// Handle product deletion
				break;
			case 'price.created':
			case 'price.updated':
				// Handle price creation and updates
				break;
			case 'price.deleted':
				// Handle price deletion
				break;
			case 'checkout.session.completed':
				// Handle checkout session completion
				break;
			case 'customer.subscription.created':
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted':
				// Handle subscription events
				break;
			default:
				console.warn(`Unhandled event type: ${event.type}`);

		}
	} catch (err) {
		console.error(`❌  Webhook handler failed for ${event.type}`, err)
		return c.json({ error: 'Webhook handler failed' }, 400)
	}

	return c.json({ received: true })
}