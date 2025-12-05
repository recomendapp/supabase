import type { Context } from 'jsr:@hono/hono'
import { bearerAuth } from "jsr:@hono/hono/bearer-auth"
import { SUPABASE_SERVICE_ROLE_KEY } from '../utils/supabase.ts';

export function supabaseAdminAuth() {
  return bearerAuth({
	verifyToken: (token: string, c: Context) => {
		if (token !== SUPABASE_SERVICE_ROLE_KEY) return false;
		return true;
	},
  })
}
