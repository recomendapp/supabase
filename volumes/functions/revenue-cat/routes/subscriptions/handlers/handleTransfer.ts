import { WebhookTransfer } from "npm:@puzzmo/revenue-cat-webhook-types";
import { supabase } from "../../../lib/supabase.ts";

export const handleTransfer = async (event: WebhookTransfer) => {
	const from = event.transferred_from.at(0);
	const to = event.transferred_to.at(0);
	const { error } = await supabase
		.from("subscriptions")
		.update({
			user_id: to,
		})
		.match({
			user_id: from,
			status: "active",
		});
	if (error) throw error;
};