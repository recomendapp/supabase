import { Hono } from 'jsr:@hono/hono'
import { bearerAuth } from "jsr:@hono/hono/bearer-auth";
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod'

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET")!

const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
)

const RevenueCatEventSchema = z.object({
  api_version: z.string(),
  event: z.object({
    app_user_id: z.string(),
    type: z.string(),
    product_id: z.string().nullable(),
    store: z.string(),
    purchased_at_ms: z.number(),
    expiration_at_ms: z.number().nullable(),
    transaction_id: z.string(),
    original_transaction_id: z.string().nullable(),
    environment: z.string(),
  })
})

const functionName = 'revenue-cat'
const app = new Hono().basePath(`/${functionName}`)

app.use('*', bearerAuth({ token: REVENUECAT_WEBHOOK_SECRET }))

app.post('/subscriptions', async (c) => {
  try {
    const payload = await c.req.json()
    const { event } = RevenueCatEventSchema.parse(payload)

    const relevantTypes = [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "PRODUCT_CHANGE",
      "CANCELLATION",
      "UNCANCELLATION",
      "EXPIRATION",
      "SUBSCRIPTION_PAUSED",
      "SUBSCRIPTION_EXTENDED"
    ]

    if (!relevantTypes.includes(event.type.toUpperCase())) {
      return c.json({ ignored: true }, 200)
    }

    const active = event.expiration_at_ms ? event.expiration_at_ms > Date.now() : true

    const { error } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: event.app_user_id,
        product_id: event.product_id!,
        store: event.store,
        status: active ? "active" : "inactive",
        purchased_at: new Date(event.purchased_at_ms),
        expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
        original_transaction_id: event.original_transaction_id,
        transaction_id: event.transaction_id,
        environment: event.environment,
      }, { onConflict: 'transaction_id' })

    if (error) {
      console.error("DB update error:", error)
      return c.json({ error: "DB update failed" }, 500)
    }
    return c.json({ success: true }, 200)
  } catch (err) {
    console.error("Webhook validation error:", err)
    return c.json({ error: "Invalid request" }, 400)
  }
})

Deno.serve(app.fetch)
