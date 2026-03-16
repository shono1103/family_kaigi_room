import { prisma } from "@/lib/prisma";

export type ListIssuedQuestsResult = Array<{
	id: string;
	title: string;
	detail: string;
	isResolved: boolean;
	createdAt: Date;
	updatedAt: Date;
	targetUser: {
		id: string;
		email: string;
		name: string | null;
		familyRole: string | null;
	} | null;
}>;

export async function listIssuedQuests(
	issuerUserId: string,
): Promise<ListIssuedQuestsResult> {
	const normalizedIssuerUserId = issuerUserId.trim();

	if (!normalizedIssuerUserId) {
		throw new Error("issuerUserId is required");
	}

	const quests = await prisma.quest.findMany({
		where: {
			issuerUserId: normalizedIssuerUserId,
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			title: true,
			detail: true,
			isResolved: true,
			createdAt: true,
			updatedAt: true,
			targetUserId: true,
		},
	});

	const targetUserIds = [...new Set(quests.map((quest) => quest.targetUserId))];
	const targetUsers = targetUserIds.length
		? await prisma.user.findMany({
				where: {
					id: {
						in: targetUserIds,
					},
				},
				select: {
					id: true,
					email: true,
					userInfo: {
						select: {
							name: true,
							familyRole: true,
						},
					},
				},
			})
		: [];

	const targetUsersById = new Map(
		targetUsers.map((user) => [
			user.id,
			{
				id: user.id,
				email: user.email,
				name: user.userInfo?.name ?? null,
				familyRole: user.userInfo?.familyRole ?? null,
			},
		]),
	);

	return quests.map((quest) => ({
		id: quest.id,
		title: quest.title,
		detail: quest.detail,
		isResolved: quest.isResolved,
		createdAt: quest.createdAt,
		updatedAt: quest.updatedAt,
		targetUser: targetUsersById.get(quest.targetUserId) ?? null,
	}));
}
