import { prisma } from "@/lib/prisma";

export type UpdateSessionInput = Readonly<{
	tokenHash?: string;
	expiresAt?: Date;
	revokedAt?: Date | null;
}>;

export async function updateSession(id: string, input: UpdateSessionInput) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	const data: {
		tokenHash?: string;
		expiresAt?: Date;
		revokedAt?: Date | null;
	} = {};

	if (undefined !== input.tokenHash) {
		const tokenHash = input.tokenHash.trim();
		if (!tokenHash) {
			throw new Error("tokenHash must not be empty");
		}
		data.tokenHash = tokenHash;
	}

	if (undefined !== input.expiresAt) {
		data.expiresAt = input.expiresAt;
	}

	if (undefined !== input.revokedAt) {
		data.revokedAt = input.revokedAt;
	}

	return prisma.session.update({
		where: {
			id: normalizedId,
		},
		data,
	});
}

export async function revokeSessionRecord(sessionId: string, userId: string, revokedAt: Date) {
	const normalizedSessionId = sessionId.trim();
	const normalizedUserId = userId.trim();

	if (!normalizedSessionId) {
		throw new Error("sessionId is required");
	}

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	const result = await prisma.session.updateMany({
		where: {
			id: normalizedSessionId,
			userId: normalizedUserId,
			revokedAt: null,
		},
		data: {
			revokedAt,
		},
	});

	return result.count > 0;
}
