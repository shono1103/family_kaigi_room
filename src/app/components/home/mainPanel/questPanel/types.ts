import type { FormEvent } from "react";

export type QuestPanelProps = {
	isActive: boolean;
	index: number;
};

export type QuestIssueResponse = {
	ok: boolean;
	message?: string;
	quest?: {
		id: string;
		title: string;
		detail: string;
		isResolved: string;
	};
};

export type QuestIssueModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
	isSubmitting: boolean;
};
