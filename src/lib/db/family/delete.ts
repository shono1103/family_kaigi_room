import { prisma } from "@/lib/prisma";

export async function deleteFamily(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.family.delete({
		where: {
			id: normalizedId,
		},
	});
}
