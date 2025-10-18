import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Context } from 'jsr:@hono/hono'
import { bearerAuth } from "jsr:@hono/hono/bearer-auth"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../utils/supabase.ts';

export function supabaseBearerAuth() {
  return bearerAuth({
    verifyToken: async (token: string, c: Context) => {
		const supabase = createClient(
			SUPABASE_URL,
			SUPABASE_ANON_KEY,
			{ global: { headers: { Authorization: `Bearer ${token}` } } }
		);
		const { data, error } = await supabase.auth.getUser(token);
		if (error || !data.user) return false;
		c.set('user', data.user);
		c.set('supabase', supabase);
		return true;
    },
  })
}