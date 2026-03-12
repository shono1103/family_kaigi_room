import { prisma } from "@/lib/prisma";

export async function deleteUser(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.user.delete({
		where: {
			id: normalizedId,
		},
	});
}
