import { prisma } from "@/lib/prisma";

export async function deleteSession(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.session.delete({
		where: {
			id: normalizedId,
		},
	});
}
