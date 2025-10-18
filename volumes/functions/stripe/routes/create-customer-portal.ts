import type { Context } from 'jsr:@hono/hono'
import { z } from 'npm:zod'
import { stripe, createOrRetrieveCustomer } from '../utils/stripe.ts'

const CreatePortalSchema = z.object({
  return_url: z.url().optional(),
})

export async function handleCreateCustomerPortal(c: Context) {
  try {
	const payload = await c.req.json().catch(() => ({}))
	const { return_url } = CreatePortalSchema.parse(payload)
    const user = c.get('user')
	const customerId = await createOrRetrieveCustomer(user.id, user.email)
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url,
    })
    return c.json({ url: session.url })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
}
