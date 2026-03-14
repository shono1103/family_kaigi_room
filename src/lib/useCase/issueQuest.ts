import type { Prisma } from "@prisma/client";
import { createQuest, type CreateQuestInput } from "@/lib/db/quest/create";
import { prisma } from "@/lib/prisma";

export type IssueQuestInput = Readonly<{
	userId: CreateQuestInput["userId"];
	targetUserId: CreateQuestInput["targetUserId"];
	title: CreateQuestInput["title"];
	detail: CreateQuestInput["detail"];
}>;

export type IssueQuestResult = Readonly<{
	quest: Awaited<ReturnType<typeof createQuest>>;
}>;

export async function issueQuest(
	input: IssueQuestInput,
): Promise<IssueQuestResult> {
	const userId = input.userId.trim();
	const targetUserId = input.targetUserId.trim();
	const title = input.title.trim();
	const detail = input.detail.trim();

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!targetUserId) {
		throw new Error("targetUserId is required");
	}

	if (!title) {
		throw new Error("title is required");
	}

	if (!detail) {
		throw new Error("detail is required");
	}

	const quest = await prisma.$transaction(async (tx: Prisma.TransactionClient) =>
		createQuest(
			{
				userId,
				title,
				detail,
				issuerUserId: userId,
				targetUserId,
				isResolved: "false",
			},
			tx,
		),
	);

	return {
		quest,
	};
}
