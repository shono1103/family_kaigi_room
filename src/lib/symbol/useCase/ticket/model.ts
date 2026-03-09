import type { TicketMetadataThumbnail } from "./schema";

export type OwnedTicketItem = Readonly<{
	mosaicId: string;
	amountRaw: string;
	name: string;
	detail: string;
	isUsed: boolean;
	thumbnail?: TicketMetadataThumbnail;
	metadataEntries: string[];
}>;
