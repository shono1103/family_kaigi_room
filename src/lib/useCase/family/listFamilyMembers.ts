import { prisma } from "@/lib/prisma";

export type ListFamilyMembersResult = Array<{
	id: string;
	name: string;
	email: string;
	familyRole: string | null;
	isFamilyOwner: boolean;
	isFirst: boolean;
}>;

export async function listFamilyMembers(
	userId: string,
): Promise<ListFamilyMembersResult> {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	const currentUser = await prisma.user.findUnique({
		where: {
			id: normalizedUserId,
		},
		select: {
			familyId: true,
		},
	});

	if (!currentUser?.familyId) {
		return [];
	}

	const members = await prisma.user.findMany({
		where: {
			familyId: currentUser.familyId,
		},
		select: {
			id: true,
			email: true,
			isFamilyOwner: true,
			isFirst: true,
			userInfo: {
				select: {
					name: true,
					familyRole: true,
				},
			},
		},
		orderBy: [{ isFamilyOwner: "desc" }, { createdAt: "asc" }],
	});

	return members.map((member) => ({
		id: member.id,
		name: member.userInfo?.name?.trim() || member.email,
		email: member.email,
		familyRole: member.userInfo?.familyRole ?? null,
		isFamilyOwner: member.isFamilyOwner,
		isFirst: member.isFirst,
	}));
}
