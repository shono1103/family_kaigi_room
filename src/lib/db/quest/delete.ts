import { prisma } from "@/lib/prisma";

export async function deleteQuest(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.quest.delete({
		where: {
			id: normalizedId,
		},
	});
}
