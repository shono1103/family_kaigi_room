import { prisma } from "@/lib/prisma";

export async function readSessionById(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.session.findUnique({
		where: {
			id: normalizedId,
		},
	});
}

export async function readSessionByTokenHash(tokenHash: string) {
	const normalizedTokenHash = tokenHash.trim();

	if (!normalizedTokenHash) {
		throw new Error("tokenHash is required");
	}

	return prisma.session.findUnique({
		where: {
			tokenHash: normalizedTokenHash,
		},
	});
}
