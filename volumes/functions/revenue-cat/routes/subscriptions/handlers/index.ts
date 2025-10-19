import { WebhookBillingIssue, WebhookCancellation, WebhookExpiration, WebhookInitialPurchase, WebhookNonRenewingPurchase, WebhookRenewal, WebhookSubscriptionExtended, WebhookSubscriptionPaused, WebhookUnCancellation } from "npm:@puzzmo/revenue-cat-webhook-types";
import { supabase } from "../../../lib/supabase.ts";

export const handleDefault = async (
	event: (
		| WebhookInitialPurchase
		| WebhookRenewal
		| WebhookCancellation
		| WebhookUnCancellation
		| WebhookNonRenewingPurchase
		| WebhookSubscriptionPaused
		| WebhookBillingIssue
		| WebhookExpiration
		| WebhookSubscriptionExtended
	)
) => {
	const { error } = await supabase
		.from("subscriptions")
		.upsert({
			user_id: event.app_user_id,
			product_id: event.product_id,
			store: event.store,
			status: (event.expiration_at_ms !== null && event.expiration_at_ms > Date.now()) ? "active" : "inactive",
			purchased_at: new Date(event.purchased_at_ms),
			expires_at: event.expiration_at_ms !== null ? new Date(event.expiration_at_ms) : null,
			original_transaction_id: event.original_transaction_id,
			transaction_id: event.transaction_id,
			environment: event.environment,
			updated_at: new Date(),
		}, { onConflict: 'original_transaction_id' })
	if (error) throw error;
};