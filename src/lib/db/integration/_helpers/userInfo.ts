import { FamilyRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateUserInfoInput } from "@/lib/db/userInfo/create";
import { createIntegrationSuffix } from "./ids";

export function createIntegrationUserInfoInput(
	userId: string,
	overrides: Partial<CreateUserInfoInput> = {},
): CreateUserInfoInput {
	const suffix = createIntegrationSuffix();

	return {
		userId,
		name: `integration-user-info-${suffix}`,
		familyRole: FamilyRole.child,
		symbolPubKey: `integration-user-info-pub-${suffix}`,
		...overrides,
	};
}

export async function cleanupUserInfosByUserIds(userIds: string[]) {
	const normalizedUserIds = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];

	if (normalizedUserIds.length === 0) {
		return;
	}

	await prisma.userInfo.deleteMany({
		where: {
			userId: {
				in: normalizedUserIds,
			},
		},
	});
}
