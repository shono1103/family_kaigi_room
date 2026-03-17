import { prisma } from "@/lib/prisma";

export async function deleteDiscussion(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.discussion.delete({
		where: {
			id: normalizedId,
		},
	});
}
