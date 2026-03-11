import { prisma } from "@/lib/prisma";

export type UpdateFamilyInput = Readonly<{
	familyName?: string;
	currencyMosaicId?: string;
	symbolPubKey?: string | null;
	symbolPrivKey?: string | null;
}>;

export async function updateFamily(id: string, input: UpdateFamilyInput) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	const data: {
		familyName?: string;
		currencyMosaicId?: string;
		symbolPubKey?: string | null;
		symbolPrivKey?: string | null;
	} = {};

	if (undefined !== input.familyName) {
		const familyName = input.familyName.trim();
		if (!familyName) {
			throw new Error("familyName must not be empty");
		}
		data.familyName = familyName;
	}

	if (undefined !== input.currencyMosaicId) {
		const currencyMosaicId = input.currencyMosaicId.trim();
		if (!currencyMosaicId) {
			throw new Error("currencyMosaicId must not be empty");
		}
		data.currencyMosaicId = currencyMosaicId;
	}

	if (undefined !== input.symbolPubKey) {
		data.symbolPubKey = input.symbolPubKey?.trim() || null;
	}

	if (undefined !== input.symbolPrivKey) {
		data.symbolPrivKey = input.symbolPrivKey?.trim() || null;
	}

	return prisma.family.update({
		where: {
			id: normalizedId,
		},
		data,
	});
}
