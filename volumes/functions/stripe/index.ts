import { Hono } from 'jsr:@hono/hono'
import { handleCreateCustomerPortal } from './routes/create-customer-portal.ts'
import { supabaseBearerAuth } from './middlewares/auth.ts';
import { handleCreateCheckoutSession } from './routes/create-checkout-session.ts';
import { handleWebhook } from './routes/webhook.ts';

const app = new Hono().basePath('/stripe')

// Middleware auth
app.use('*', async (c, next) => {
	await next()
})

// Route
app.post('/webhook', handleWebhook)
app.post('/create-customer-portal', supabaseBearerAuth(), handleCreateCustomerPortal)
app.post('/create-checkout-session', supabaseBearerAuth(), handleCreateCheckoutSession)

Deno.serve(app.fetch)
