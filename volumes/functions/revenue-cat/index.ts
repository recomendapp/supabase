import { Hono } from 'jsr:@hono/hono'
import { bearerAuth } from "jsr:@hono/hono/bearer-auth";
import { handleSubscriptions } from './routes/subscriptions/index.ts';

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET")!

const functionName = 'revenue-cat'
const app = new Hono().basePath(`/${functionName}`)
app.use('*', bearerAuth({ token: REVENUECAT_WEBHOOK_SECRET }))

app.post('/subscriptions', handleSubscriptions)

Deno.serve(app.fetch)
