export type QueueMessage = {
	msg_id: bigint
	read_ct: number
	vt: string
	enqueued_at: string
	message: any
}