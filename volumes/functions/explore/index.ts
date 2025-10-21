import { Hono } from 'jsr:@hono/hono'
import { handleGetTile } from './routes/tile/index.ts';

const app = new Hono().basePath('/explore')

// Middleware auth
app.use('*', async (c, next) => {
	await next()
})

// Route
app.get('/tile', handleGetTile)

Deno.serve(app.fetch)
