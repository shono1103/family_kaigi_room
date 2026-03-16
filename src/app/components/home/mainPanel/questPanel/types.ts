import type { FormEvent } from "react";

export type QuestPanelProps = {
	isActive: boolean;
	index: number;
	issuedQuests: Array<{
		id: string;
		title: string;
		detail: string;
		isResolved: boolean;
		createdAt: Date;
		updatedAt: Date;
		targetUser: {
			id: string;
			email: string;
			name: string | null;
			familyRole: string | null;
		} | null;
	}>;
	targetQuests: Array<{
		id: string;
		title: string;
		detail: string;
		isResolved: boolean;
		createdAt: Date;
		updatedAt: Date;
		issuerUser: {
			id: string;
			email: string;
			name: string | null;
			familyRole: string | null;
		} | null;
	}>;
	targetUsers: Array<{
		id: string;
		label: string;
	}>;
};

export type QuestIssueResponse = {
	ok: boolean;
	message?: string;
	quest?: {
		id: string;
		title: string;
		detail: string;
		isResolved: boolean;
	};
};

export type QuestIssueModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
	isSubmitting: boolean;
	targetUsers: Array<{
		id: string;
		label: string;
	}>;
};
