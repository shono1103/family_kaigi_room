import type { OwnedTicketItem } from "./model";

export type OwnedTicketsResult =
	| Readonly<{
			status: "ok";
			tickets: OwnedTicketItem[];
	  }>
	| Readonly<{
			status:
				| "missing_public_key"
				| "invalid_public_key"
				| "account_not_found"
				| "node_unreachable"
				| "read_failed";
			tickets: OwnedTicketItem[];
	  }>;
