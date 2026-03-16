"use client";

import type { FormEvent } from "react";

export type DiscussionPanelProps = {
	isActive: boolean;
	index: number;
};

export type DiscussionItem = {
	id: string;
	title: string;
	detail: string;
	authorName: string;
	createdAt: Date;
};

export type DiscussionCreateResponse = {
	ok: boolean;
	message?: string;
	discussion?: {
		id: string;
		title: string;
		detail: string;
		authorUserId: string;
		createdAt: string;
		updatedAt: string;
		userId: string;
	};
};

export type DiscussionPostModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
	isSubmitting: boolean;
};
