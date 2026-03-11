import { prisma } from "@/lib/prisma";

export type CreateFamilyInput = Readonly<{
	familyName: string;
	currencyMosaicId: string;
	symbolPubKey?: string | null;
	symbolPrivKey?: string | null;
}>;

export async function createFamily(input: CreateFamilyInput) {
	const familyName = input.familyName.trim();
	const currencyMosaicId = input.currencyMosaicId.trim();
	const symbolPubKey = input.symbolPubKey?.trim() || null;
	const symbolPrivKey = input.symbolPrivKey?.trim() || null;

	if (!familyName) {
		throw new Error("familyName is required");
	}

	if (!currencyMosaicId) {
		throw new Error("currencyMosaicId is required");
	}

	return prisma.family.create({
		data: {
			familyName,
			currencyMosaicId,
			symbolPubKey,
			symbolPrivKey,
		},
	});
}
