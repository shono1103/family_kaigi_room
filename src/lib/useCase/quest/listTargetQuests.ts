import { prisma } from "@/lib/prisma";

export type ListTargetQuestsResult = Array<{
	id: string;
	title: string;
	detail: string;
	questType: string;
	voiceReward: number;
	isResolved: boolean;
	evaluationPercent: number | null;
	isRewarded: boolean;
	createdAt: Date;
	updatedAt: Date;
	issuerUser: {
		id: string;
		email: string;
		name: string | null;
		familyRole: string | null;
	} | null;
}>;

export async function listTargetQuests(
	targetUserId: string,
): Promise<ListTargetQuestsResult> {
	const normalizedTargetUserId = targetUserId.trim();

	if (!normalizedTargetUserId) {
		throw new Error("targetUserId is required");
	}

	const quests = await prisma.quest.findMany({
		where: {
			targetUserId: normalizedTargetUserId,
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			title: true,
			detail: true,
			questType: true,
			voiceReward: true,
			isResolved: true,
			evaluationPercent: true,
			isRewarded: true,
			createdAt: true,
			updatedAt: true,
			issuerUserId: true,
		},
	});

	const issuerUserIds = [...new Set(quests.map((quest) => quest.issuerUserId))];
	const issuerUsers = issuerUserIds.length
		? await prisma.user.findMany({
				where: {
					id: {
						in: issuerUserIds,
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

	const issuerUsersById = new Map(
		issuerUsers.map((user) => [
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
		questType: quest.questType,
		voiceReward: quest.voiceReward,
		isResolved: quest.isResolved,
		evaluationPercent: quest.evaluationPercent,
		isRewarded: quest.isRewarded,
		createdAt: quest.createdAt,
		updatedAt: quest.updatedAt,
		issuerUser: issuerUsersById.get(quest.issuerUserId) ?? null,
	}));
}
