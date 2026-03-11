import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateUserInput } from "@/lib/db/user/create";
import { createIntegrationSuffix } from "./ids";

export function createIntegrationUserInput(
	familyId: string,
	overrides: Partial<CreateUserInput> = {},
): CreateUserInput {
	const suffix = createIntegrationSuffix();

	return {
		email: `integration-user-${suffix}@example.com`,
		passwordHash: `integration-password-hash-${suffix}`,
		familyId,
		isFamilyOwner: false,
		role: UserRole.normal,
		...overrides,
	};
}

export async function cleanupUsersByIds(ids: string[]) {
	const normalizedIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

	if (normalizedIds.length === 0) {
		return;
	}

	await prisma.user.deleteMany({
		where: {
			id: {
				in: normalizedIds,
			},
		},
	});
}
