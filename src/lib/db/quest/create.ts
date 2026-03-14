import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateQuestInput = Readonly<{
	userId: string;
	title: string;
	detail: string;
	isResolved: string;
}>;

type QuestDbClient = PrismaClient | Prisma.TransactionClient;

export async function createQuest(
	input: CreateQuestInput,
	db: QuestDbClient = prisma,
) {
	const userId = input.userId.trim();
	const title = input.title.trim();
	const detail = input.detail.trim();
	const isResolved = input.isResolved.trim();

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!title) {
		throw new Error("title is required");
	}

	if (!detail) {
		throw new Error("detail is required");
	}

	if (!isResolved) {
		throw new Error("isResolved is required");
	}

	return db.quest.create({
		data: {
			userId,
			title,
			detail,
			isResolved,
		},
	});
}
