import { supabaseAdmin } from "../_shared/supabase-admin.ts";

export async function uploadGzip(path: string, content: Uint8Array) {
	await supabaseAdmin.storage
		.from("sitemaps")
		.upload(path, content, {
		upsert: true,
		contentType: "application/xml",
		});
}
