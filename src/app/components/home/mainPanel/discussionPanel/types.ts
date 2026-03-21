"use client";

import type { FormEvent } from "react";

export type DiscussionPanelProps = {
	isActive: boolean;
	index: number;
	initialDiscussions: DiscussionItem[];
};

export type DiscussionItem = {
	id: string;
	title: string;
	detail: string;
	authorName: string | null;
	createdAt: Date;
	chatRoomId: string | null;
};

export type DiscussionCreateResponse = {
	ok: boolean;
	message?: string;
	chatRoomId?: string;
	discussion?: {
		id: string;
		title: string;
		detail: string;
		authorUserId: string;
		createdAt: string;
		updatedAt: string;
	};
};

export type DiscussionPostModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
	isSubmitting: boolean;
};

export type ChatMessage = {
	id: string;
	content: string;
	createdAt: Date;
	authorName: string | null;
	authorUserId: string;
	isCurrentUser: boolean;
};
