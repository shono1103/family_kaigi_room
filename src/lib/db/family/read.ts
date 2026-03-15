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

export async function readFamilyByFamilyVoiceMosaicId(familyVoiceMosaicId: string) {
	const normalizedFamilyVoiceMosaicId = familyVoiceMosaicId.trim();

	if (!normalizedFamilyVoiceMosaicId) {
		throw new Error("familyVoiceMosaicId is required");
	}

	return prisma.family.findUnique({
		where: {
			familyVoiceMosaicId: normalizedFamilyVoiceMosaicId,
		},
	});
}
