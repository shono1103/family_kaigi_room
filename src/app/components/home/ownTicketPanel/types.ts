import type { FormEvent } from "react";
import type { OwnedTicketItem } from "@/lib/symbol/useCase/ticket/model";
import type { OwnedTicketsResult } from "@/lib/symbol/useCase/ticket/result";

export type OwnTicketPanelProps = {
	isActive: boolean;
	index: number;
	ownedTickets: OwnedTicketsResult;
};

export type TicketIssueResponse = {
	ok: boolean;
	message?: string;
	mosaicId?: string;
	transactionHash?: string;
};

export type TicketIssueModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
	isSubmitting: boolean;
};

export type TicketDetailModalProps = {
	ticket: OwnedTicketItem | null;
	onClose: () => void;
};
