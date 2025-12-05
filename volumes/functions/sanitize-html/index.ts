import { Hono } from 'jsr:@hono/hono'
import { handleSanitizeUserReviewsMovie } from './routes/user-reviews-movie.ts';
import { handleSanitizeUserReviewsTvSeries } from './routes/user-reviews-tv-series.ts';
import { supabaseAdminAuth } from './middlewares/auth.ts';

const app = new Hono().basePath('/sanitize-html')

// Middleware auth
app.use('*', async (c, next) => {
	await next()
})

// Route
app.post('/user-reviews-movie', supabaseAdminAuth(), handleSanitizeUserReviewsMovie)
app.post('/user-reviews-tv-series', supabaseAdminAuth(), handleSanitizeUserReviewsTvSeries)

Deno.serve(app.fetch)
