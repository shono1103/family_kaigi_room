import type { FormEvent } from "react";

export type QuestPanelProps = {
	isActive: boolean;
	index: number;
	isFamilyOwner: boolean;
	issuedQuests: Array<{
		id: string;
		title: string;
		detail: string;
		questType: string;
		voiceReward: number;
		isResolved: boolean;
		evaluationPercent: number | null;
		isRewarded: boolean;
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
		questType: string;
		voiceReward: number;
		isResolved: boolean;
		evaluationPercent: number | null;
		isRewarded: boolean;
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
	quests?: Array<{
		id: string;
		title: string;
	}>;
};

export type QuestEvaluateResponse = {
	ok: boolean;
	message?: string;
	rewardSent?: boolean;
	rewardAmount?: number;
	refundAmount?: number;
	refundSent?: boolean;
};

export type QuestIssueModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
	isSubmitting: boolean;
	isFamilyOwner: boolean;
	targetUsers: Array<{
		id: string;
		label: string;
	}>;
};
