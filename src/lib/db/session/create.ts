import { prisma } from "@/lib/prisma";

export type CreateSessionInput = Readonly<{
	userId: string;
	tokenHash: string;
	expiresAt: Date;
	revokedAt?: Date | null;
}>;

export async function createSessionRecord(input: CreateSessionInput) {
	const userId = input.userId.trim();
	const tokenHash = input.tokenHash.trim();

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!tokenHash) {
		throw new Error("tokenHash is required");
	}

	return prisma.session.create({
		data: {
			userId,
			tokenHash,
			expiresAt: input.expiresAt,
			revokedAt: input.revokedAt ?? null,
		},
	});
}
