import { prisma } from "@/lib/prisma";

export async function readFamilyById(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.family.findUnique({
		where: {
			id: normalizedId,
		},
	});
}

export async function readFamilyByCurrencyMosaicId(currencyMosaicId: string) {
	const normalizedCurrencyMosaicId = currencyMosaicId.trim();

	if (!normalizedCurrencyMosaicId) {
		throw new Error("currencyMosaicId is required");
	}

	return prisma.family.findUnique({
		where: {
			currencyMosaicId: normalizedCurrencyMosaicId,
		},
	});
}
