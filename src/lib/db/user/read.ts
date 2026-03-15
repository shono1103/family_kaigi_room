import { prisma } from "@/lib/prisma";

export async function readUserById(id: string) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	return prisma.user.findUnique({
		where: {
			id: normalizedId,
		},
	});
}

export async function readUserByEmail(email: string) {
	const normalizedEmail = email.trim().toLowerCase();

	if (!normalizedEmail) {
		throw new Error("email is required");
	}

	return prisma.user.findUnique({
		where: {
			email: normalizedEmail,
		},
	});
}

export async function readUserFamilyByUserId(userId: string) {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	return prisma.user.findUnique({
		where: {
			id: normalizedUserId,
		},
		select: {
			family: {
				select: {
					familyName: true,
					symbolPubKey: true,
					familyVoiceMosaicId: true,
				},
			},
		},
	});
}
