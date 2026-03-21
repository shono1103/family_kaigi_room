import type { Prisma, PrismaClient, QuestType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateQuestInput = Readonly<{
	userId: string;
	title: string;
	detail: string;
	questType: QuestType;
	voiceReward: number;
	issuerUserId: string;
	targetUserId: string;
	isResolved: boolean;
}>;

type QuestDbClient = PrismaClient | Prisma.TransactionClient;

export async function createQuest(
	input: CreateQuestInput,
	db: QuestDbClient = prisma,
) {
	const userId = input.userId.trim();
	const title = input.title.trim();
	const detail = input.detail.trim();
	const questType = input.questType;
	const voiceReward = input.voiceReward;
	const issuerUserId = input.issuerUserId.trim();
	const targetUserId = input.targetUserId.trim();
	const isResolved = input.isResolved;

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!title) {
		throw new Error("title is required");
	}

	if (!detail) {
		throw new Error("detail is required");
	}

	if (!issuerUserId) {
		throw new Error("issuerUserId is required");
	}

	if (!targetUserId) {
		throw new Error("targetUserId is required");
	}

	return db.quest.create({
		data: {
			userId,
			title,
			detail,
			questType,
			voiceReward,
			issuerUserId,
			targetUserId,
			isResolved,
		},
	});
}
