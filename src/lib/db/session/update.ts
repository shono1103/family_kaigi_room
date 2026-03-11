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
