import { prisma } from "@/lib/prisma";
import type { CreateFamilyInput } from "@/lib/db/family/create";
import { createIntegrationSuffix } from "./ids";

export function createIntegrationFamilyInput(
	overrides: Partial<CreateFamilyInput> = {},
): CreateFamilyInput {
	const suffix = createIntegrationSuffix();

	return {
		familyName: `integration-family-${suffix}`,
		currencyMosaicId: `integration-mosaic-${suffix}`,
		symbolPubKey: `integration-symbol-pub-${suffix}`,
		symbolPrivKey: `integration-symbol-priv-${suffix}`,
		...overrides,
	};
}

export async function cleanupFamiliesByIds(ids: string[]) {
	const normalizedIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

	if (normalizedIds.length === 0) {
		return;
	}

	await prisma.family.deleteMany({
		where: {
			id: {
				in: normalizedIds,
			},
		},
	});
}
