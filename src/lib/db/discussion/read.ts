import { prisma } from "@/lib/prisma";

export async function readDiscussionById(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.discussion.findUnique({
		where: {
			id: normalizedId,
		},
	});
}

export async function readDiscussionsByUserId(userId: string) {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	return prisma.discussion.findMany({
		where: {
			userId: normalizedUserId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function readDiscussionsByAuthorUserId(authorUserId: string) {
	const normalizedAuthorUserId = authorUserId.trim();

	if (!normalizedAuthorUserId) {
		throw new Error("authorUserId is required");
	}

	return prisma.discussion.findMany({
		where: {
			authorUserId: normalizedAuthorUserId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}
