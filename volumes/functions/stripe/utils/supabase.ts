import { createClient } from 'npm:@supabase/supabase-js@2'

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
export const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)