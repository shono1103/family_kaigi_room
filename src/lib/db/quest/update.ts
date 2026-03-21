import { prisma } from "@/lib/prisma";

export type UpdateQuestInput = Readonly<{
	title?: string;
	detail?: string;
	issuerUserId?: string;
	targetUserId?: string;
	isResolved?: boolean;
	evaluationPercent?: number;
	isRewarded?: boolean;
}>;

export async function updateQuest(id: string, input: UpdateQuestInput) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	const data: {
		title?: string;
		detail?: string;
		issuerUserId?: string;
		targetUserId?: string;
		isResolved?: boolean;
		evaluationPercent?: number;
		isRewarded?: boolean;
	} = {};

	if (undefined !== input.title) {
		const title = input.title.trim();
		if (!title) {
			throw new Error("title must not be empty");
		}
		data.title = title;
	}

	if (undefined !== input.detail) {
		const detail = input.detail.trim();
		if (!detail) {
			throw new Error("detail must not be empty");
		}
		data.detail = detail;
	}

	if (undefined !== input.issuerUserId) {
		const issuerUserId = input.issuerUserId.trim();
		if (!issuerUserId) {
			throw new Error("issuerUserId must not be empty");
		}
		data.issuerUserId = issuerUserId;
	}

	if (undefined !== input.targetUserId) {
		const targetUserId = input.targetUserId.trim();
		if (!targetUserId) {
			throw new Error("targetUserId must not be empty");
		}
		data.targetUserId = targetUserId;
	}

	if (undefined !== input.isResolved) {
		data.isResolved = input.isResolved;
	}

	if (undefined !== input.evaluationPercent) {
		data.evaluationPercent = input.evaluationPercent;
	}

	if (undefined !== input.isRewarded) {
		data.isRewarded = input.isRewarded;
	}

	return prisma.quest.update({
		where: {
			id: normalizedId,
		},
		data,
	});
}
