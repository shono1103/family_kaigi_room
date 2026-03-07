export type TicketMetadataThumbnail = Readonly<{
	filename: string;
	mimeType: string;
	size: number;
	sha256: string;
}>;

export type TicketMetadata = Readonly<{
	name: string;
	detail: string;
	isUsed: boolean;
	thumbnail?: TicketMetadataThumbnail;
}>;
