import { Hono } from 'jsr:@hono/hono'
import { handleCreatePortal } from './routes/create-portal.ts'
import { supabaseBearerAuth } from './middlewares/auth.ts';
import { handleCreateCheckoutSession } from './routes/create-checkout-session.ts';

const app = new Hono().basePath('/stripe')

// Middleware auth
app.use('*', async (c, next) => {
	await next()
})

// Route
app.post('/create-portal', supabaseBearerAuth(), handleCreatePortal)
app.post('/create-checkout-session', supabaseBearerAuth(), handleCreateCheckoutSession)

Deno.serve(app.fetch)
