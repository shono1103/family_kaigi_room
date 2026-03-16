import type { Prisma } from "@prisma/client";
import {
	createDiscussion as createDiscussionRecord,
	type CreateDiscussionInput,
} from "@/lib/db/discussion/create";
import { prisma } from "@/lib/prisma";

export type CreateDiscussionUseCaseInput = Readonly<{
	userId: CreateDiscussionInput["userId"];
	title: CreateDiscussionInput["title"];
	detail: CreateDiscussionInput["detail"];
}>;

export type CreateDiscussionUseCaseResult = Readonly<{
	discussion: Awaited<ReturnType<typeof createDiscussionRecord>>;
}>;

export async function createDiscussion(
	input: CreateDiscussionUseCaseInput,
): Promise<CreateDiscussionUseCaseResult> {
	const userId = input.userId.trim();
	const title = input.title.trim();
	const detail = input.detail.trim();

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!title) {
		throw new Error("title is required");
	}

	if (!detail) {
		throw new Error("detail is required");
	}

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			familyId: true,
		},
	});

	if (!user?.familyId) {
		throw new Error("user family was not found");
	}

	const discussion = await prisma.$transaction(
		async (tx: Prisma.TransactionClient) =>
			createDiscussionRecord(
				{
					userId,
					familyId: user.familyId,
					title,
					detail,
					authorUserId: userId,
				},
				tx,
			),
	);

	return {
		discussion,
	};
}
