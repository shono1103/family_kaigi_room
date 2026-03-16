import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateDiscussionInput = Readonly<{
	userId: string;
	title: string;
	detail: string;
	authorUserId: string;
}>;

type DiscussionDbClient = PrismaClient | Prisma.TransactionClient;

export async function createDiscussion(
	input: CreateDiscussionInput,
	db: DiscussionDbClient = prisma,
) {
	const userId = input.userId.trim();
	const title = input.title.trim();
	const detail = input.detail.trim();
	const authorUserId = input.authorUserId.trim();

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!title) {
		throw new Error("title is required");
	}

	if (!detail) {
		throw new Error("detail is required");
	}

	if (!authorUserId) {
		throw new Error("authorUserId is required");
	}

	return db.discussion.create({
		data: {
			userId,
			title,
			detail,
			authorUserId,
		},
	});
}
