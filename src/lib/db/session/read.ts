import { prisma } from "@/lib/prisma";

export type ActiveSessionRecord = {
	id: string;
	createdAt: Date;
	expiresAt: Date;
};

export type AuthSessionRecord = {
	id: string;
	createdAt: Date;
	expiresAt: Date;
	revokedAt: Date | null;
	user: {
		id: string;
		email: string;
	};
};

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

export async function readAuthSessionByTokenHash(
	tokenHash: string,
): Promise<AuthSessionRecord | null> {
	const normalizedTokenHash = tokenHash.trim();

	if (!normalizedTokenHash) {
		throw new Error("tokenHash is required");
	}

	return prisma.session.findUnique({
		where: {
			tokenHash: normalizedTokenHash,
		},
		select: {
			id: true,
			createdAt: true,
			expiresAt: true,
			revokedAt: true,
			user: {
				select: {
					id: true,
					email: true,
				},
			},
		},
	});
}

export async function listActiveSessionRecordsByUserId(
	userId: string,
	now: Date,
): Promise<ActiveSessionRecord[]> {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	return prisma.session.findMany({
		where: {
			userId: normalizedUserId,
			revokedAt: null,
			expiresAt: {
				gt: now,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			createdAt: true,
			expiresAt: true,
		},
	});
}
