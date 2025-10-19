import type { Context } from 'jsr:@hono/hono'
import { Webhook } from 'npm:@puzzmo/revenue-cat-webhook-types';
import { handleDefault } from './handlers/index.ts';
import { handleProductChange } from './handlers/handleProductChange.ts';
import { handleTransfer } from './handlers/handleTransfer.ts';

export const handleSubscriptions = async (c: Context) => {
	try {
		const { event }: Webhook = await c.req.json();
		switch (event.type) {
			case 'INITIAL_PURCHASE':
			case 'RENEWAL':
			case 'CANCELLATION':
			case 'UNCANCELLATION':
			case 'NON_RENEWING_PURCHASE':
			case 'SUBSCRIPTION_PAUSED':
			case 'BILLING_ISSUE':
			case 'EXPIRATION':
			case 'SUBSCRIPTION_EXTENDED':
				await handleDefault(event);
				break;
			case 'PRODUCT_CHANGE':
				await handleProductChange(event);
				break;
			case 'TRANSFER':
				await handleTransfer(event);
				break;
			default:
				return c.json({ error: 'Event type not relevant' }, 400)
		}
		return c.json({ success: true }, 200)
	} catch (err) {
		console.error("Webhook validation error:", err)
		return c.json({ error: "Invalid request" }, 400)
	}
}