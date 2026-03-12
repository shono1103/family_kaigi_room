import { prisma } from "@/lib/prisma";
import type { CreateSessionInput } from "@/lib/db/session/create";
import { createIntegrationSuffix } from "./ids";

export function createIntegrationSessionInput(
	userId: string,
	overrides: Partial<CreateSessionInput> = {},
): CreateSessionInput {
	const suffix = createIntegrationSuffix();

	return {
		userId,
		tokenHash: `integration-token-hash-${suffix}`,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60),
		revokedAt: null,
		...overrides,
	};
}

export async function cleanupSessionsByIds(ids: string[]) {
	const normalizedIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

	if (normalizedIds.length === 0) {
		return;
	}

	await prisma.session.deleteMany({
		where: {
			id: {
				in: normalizedIds,
			},
		},
	});
}
