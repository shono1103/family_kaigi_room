import { prisma } from "@/lib/prisma";
import type { CreateFamilyInput } from "@/lib/db/family/create";
import { createIntegrationSuffix } from "./ids";

export function createIntegrationFamilyInput(
	overrides: Partial<CreateFamilyInput> = {},
): CreateFamilyInput {
	const suffix = createIntegrationSuffix().replace(/-/g, "").toUpperCase();
	const symbolHex = suffix.padEnd(64, "A").slice(0, 64);
	const privateHex = suffix.padEnd(64, "B").slice(0, 64);
	const mosaicHex = suffix.padEnd(16, "C").slice(0, 16);

	return {
		familyName: `integration-family-${suffix}`,
		currencyMosaicId: mosaicHex,
		symbolPubKey: symbolHex,
		symbolPrivKey: privateHex,
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

export async function cleanupFamiliesByNames(familyNames: string[]) {
	const normalizedFamilyNames = [
		...new Set(familyNames.map((familyName) => familyName.trim()).filter(Boolean)),
	];

	if (normalizedFamilyNames.length === 0) {
		return;
	}

	await prisma.family.deleteMany({
		where: {
			familyName: {
				in: normalizedFamilyNames,
			},
		},
	});
}
