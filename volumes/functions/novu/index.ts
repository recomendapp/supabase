import { Hono } from 'jsr:@hono/hono'
import { z } from 'npm:zod'
import { encodeHex } from "jsr:@std/encoding/hex";

const apiKey = Deno.env.get("NOVU_API_KEY");

/* --------------------------------- SCHEMAS -------------------------------- */
const SubscriberIdSchema = z.object({
  subscriberId: z.string().min(1, "subscriberId is required"),
});
/* -------------------------------------------------------------------------- */

const functionName = 'novu'
const app = new Hono().basePath(`/${functionName}`)

app.post('/subscriber/hash', async (c) => {
  try {
	const payload = await c.req.json();
	const { subscriberId } = SubscriberIdSchema.parse(payload);
	if (!apiKey) {
		return c.json({ error: 'NOVU_API_KEY is not set' }, 500);
	}
	const enc = new TextEncoder();
    const keyData = enc.encode(apiKey);
    const data = enc.encode(subscriberId);

	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	
	const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
	const hash = encodeHex(signature);
	return c.json({ hash });
  } catch (error) {
	console.error('Error hashing subscriber ID:', error);
	return c.json({ error: 'Internal Server Error' }, 500)
  }
})

Deno.serve(app.fetch)
