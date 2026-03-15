"use client";

import type { FormEvent } from "react";

export type AgendaPanelProps = {
	isActive: boolean;
	index: number;
};

export type AgendaItem = {
	id: string;
	title: string;
	detail: string;
	author: string;
	createdAt: string;
};

export type AgendaPostModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
