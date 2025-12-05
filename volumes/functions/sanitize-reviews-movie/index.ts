import postgres from "npm:postgres"
import DOMPurify from "npm:isomorphic-dompurify@2.11.0"
import { createClient } from "npm:@supabase/supabase-js@2"
import { QueueMessage } from "../_shared/QueueMessage.type.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const sql = postgres(SUPABASE_DB_URL, { ssl: false })

const QUEUE = "sanitize_review_movie_queue"

const ALLOWED_CONFIG = {
  ALLOWED_TAGS: ['p','strong','em','u','s','ul','ol','li','br','a','h1','h2','h3','blockquote'],
  ALLOWED_ATTR: ['href','target','rel'],
  ALLOW_DATA_ATTR: false,
}

async function processMessage(msg: QueueMessage) {
  const review_id = msg.message.review_id

  const { data } = await supabase
    .from("user_reviews_movie")
    .select("body_html")
    .eq("id", review_id)
    .single()

  if (!data) return

  const cleaned = DOMPurify.sanitize(data.body_html ?? "", ALLOWED_CONFIG)

  await supabase
    .from("user_reviews_movie")
    .update({
      body_html: cleaned,
      is_sanitized: true
    })
    .eq("id", review_id)

  await sql`
    SELECT pgmq.delete(
      queue_name => ${QUEUE},
      msg_id => ${msg.msg_id}
    );
  `
}

Deno.serve(async () => {
  const messages = await sql`
    SELECT * FROM pgmq.read(
      queue_name => ${QUEUE},
      vt => 60,
      qty => 5
    );
  `

  if (messages.length === 0) {
    return new Response("No messages", { status: 200 })
  }

  for (const msg of messages) {
    await processMessage(msg)
  }

  return new Response("Processed " + messages.length + " messages")
})
