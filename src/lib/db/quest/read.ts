import { prisma } from "@/lib/prisma";

export async function readQuestById(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.quest.findUnique({
		where: {
			id: normalizedId,
		},
	});
}

export async function readQuestsByUserId(userId: string) {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	return prisma.quest.findMany({
		where: {
			userId: normalizedUserId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function readQuestsByIsResolved(isResolved: boolean) {
	return prisma.quest.findMany({
		where: {
			isResolved,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}
