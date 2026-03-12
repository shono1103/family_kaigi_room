import { prisma } from "@/lib/prisma";

export async function deleteUserInfo(userId: string) {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	return prisma.userInfo.delete({
		where: {
			userId: normalizedUserId,
		},
	});
}
