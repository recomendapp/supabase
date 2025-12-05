import type { Context } from 'jsr:@hono/hono'
import DOMPurify from "npm:isomorphic-dompurify@2.11.0"
import { supabaseAdmin } from '../utils/supabase.ts';

const ALLOWED_CONFIG = {
  ALLOWED_TAGS: ['p','strong','em','u','s','ul','ol','li','br','a','h1','h2','h3','blockquote'],
  ALLOWED_ATTR: ['href','target','rel'],
  ALLOW_DATA_ATTR: false,
}

export const handleSanitizeUserReviewsTvSeries = async (c: Context) => {
  const { review_id } = await c.req.json();

  if (!review_id) {
    return c.json({ error: 'Missing review_id' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('user_reviews_tv')
    .select('body_html')
    .eq('id', review_id)
    .single();

  if (error || !data) {
    return c.json({ error: 'Review not found' }, 404);
  }

  const original = data.body_html ?? '';
  const cleaned = DOMPurify.sanitize(original, ALLOWED_CONFIG);

  await supabaseAdmin
    .from('user_reviews_tv')
    .update({
      body_html: cleaned,
      is_sanitized: true
    })
    .eq('id', review_id);

  return c.json({
    review_id,
    original_length: original.length,
    cleaned_length: cleaned.length,
    status: 'sanitized',
  });
}
