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

/* --------------------------------- SCHEMAS -------------------------------- */
const BaseEventSchema = z.object({
  app_user_id: z.string(),
  type: z.string(),
  product_id: z.string().nullable(),
  store: z.string(),
  purchased_at_ms: z.number(),
  expiration_at_ms: z.number().nullable(),
  transaction_id: z.string(),
  original_transaction_id: z.string(),
  environment: z.string(),
});

const InitialPurchaseEventSchema = BaseEventSchema.extend({
  type: z.literal("INITIAL_PURCHASE"),
});

const RenewalEventSchema = BaseEventSchema.extend({
  type: z.literal("RENEWAL"),
});

const CancellationEventSchema = BaseEventSchema.extend({
  type: z.literal("CANCELLATION"),
  cancel_reason: z.string().optional(),
});

const ExpirationEventSchema = BaseEventSchema.extend({
  type: z.literal("EXPIRATION"),
  expiration_reason: z.string().optional(),
});

const ProductChangeEventSchema = BaseEventSchema.extend({
  type: z.literal("PRODUCT_CHANGE"),
  new_product_id: z.string(),
});

const RevenueCatEventSchema = z.object({
  api_version: z.string(),
  event: z.union([
    InitialPurchaseEventSchema,
    RenewalEventSchema,
    CancellationEventSchema,
    ExpirationEventSchema,
    ProductChangeEventSchema,
  ]),
});
/* -------------------------------------------------------------------------- */

const functionName = 'revenue-cat'
const app = new Hono().basePath(`/${functionName}`)
app.use('*', bearerAuth({ token: REVENUECAT_WEBHOOK_SECRET }))

app.post('/subscriptions', async (c) => {
  try {
    const payload = await c.req.json()
    const { event } = RevenueCatEventSchema.parse(payload)
    const type = event.type.toUpperCase()

    switch (type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
        await supabase
          .from("subscriptions")
          .upsert({
            user_id: event.app_user_id,
            product_id: event.product_id!,
            store: event.store,
            status: (event.expiration_at_ms && event.expiration_at_ms > Date.now()) ? "active" : "inactive",
            purchased_at: new Date(event.purchased_at_ms),
            expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
            original_transaction_id: event.original_transaction_id,
            transaction_id: event.transaction_id,
            environment: event.environment,
          }, { onConflict: 'original_transaction_id' })
        break
      
      case "EXPIRATION":
      case "CANCELLATION":
        await supabase
          .from("subscriptions")
          .update({
            user_id: event.app_user_id,
            store: event.store,
            status: (event.expiration_at_ms ? event.expiration_at_ms > Date.now() : false) ? "active" : "inactive",
            purchased_at: new Date(event.purchased_at_ms),
            expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
            original_transaction_id: event.original_transaction_id,
            transaction_id: event.transaction_id,
            environment: event.environment,
          })
          .eq("original_transaction_id", event.original_transaction_id)
        break

      case "PRODUCT_CHANGE":
        await supabase
          .from("subscriptions")
          .upsert({
            user_id: event.app_user_id,
            product_id: event.new_product_id,
            store: event.store,
            status: "active",
            purchased_at: new Date(event.purchased_at_ms),
            expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
            original_transaction_id: event.original_transaction_id,
            transaction_id: event.transaction_id,
            environment: event.environment,
          }, { onConflict: 'original_transaction_id' })
        break

      default:
        return c.json({ ignored: true }, 200)
    }

    return c.json({ success: true }, 200)
  } catch (err) {
    console.error("Webhook validation error:", err)
    return c.json({ error: "Invalid request" }, 400)
  }
})

Deno.serve(app.fetch)
