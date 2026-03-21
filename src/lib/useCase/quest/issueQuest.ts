import type { Prisma, QuestType } from "@prisma/client";
import { createQuest, type CreateQuestInput } from "@/lib/db/quest/create";
import { prisma } from "@/lib/prisma";
import { sendVoiceOnChain } from "@/lib/symbol/useCase/voice/send";

const PERSONAL_QUEST_VOICE_MIN = 1;
const PERSONAL_QUEST_VOICE_MAX = 5;
const FAMILY_QUEST_VOICE_MIN = 1;
const FAMILY_QUEST_VOICE_MAX = 100;

export type IssueQuestInput = Readonly<{
	userId: CreateQuestInput["userId"];
	questType: QuestType;
	voiceReward: number;
	targetUserId?: string;
	title: CreateQuestInput["title"];
	detail: CreateQuestInput["detail"];
	/** personalQuest の場合のみ必須。発行者が報酬をfamilyアカウントへエスクロー送金するために使用。 */
	issuerPrivateKey?: string;
}>;

export type IssueQuestResult = Readonly<{
	quests: Awaited<ReturnType<typeof createQuest>>[];
}>;

export async function issueQuest(
	input: IssueQuestInput,
): Promise<IssueQuestResult> {
	const userId = input.userId.trim();
	const questType = input.questType;
	const voiceReward = input.voiceReward;
	const title = input.title.trim();
	const detail = input.detail.trim();

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!title) {
		throw new Error("title is required");
	}

	if (!detail) {
		throw new Error("detail is required");
	}

	if (questType === "personalQuest") {
		if (voiceReward < PERSONAL_QUEST_VOICE_MIN || voiceReward > PERSONAL_QUEST_VOICE_MAX) {
			throw new Error(
				`personalQuestの報酬は${PERSONAL_QUEST_VOICE_MIN}〜${PERSONAL_QUEST_VOICE_MAX}で設定してください。`,
			);
		}
		const targetUserId = input.targetUserId?.trim();
		if (!targetUserId) {
			throw new Error("personalQuestには対象ユーザーの指定が必要です。");
		}
		const issuerPrivateKey = input.issuerPrivateKey?.trim();
		if (!issuerPrivateKey) {
			throw new Error("personalQuestの発行にはあなたのSymbol秘密鍵が必要です。");
		}

		// 発行者 → familyアカウントへ voiceReward をエスクロー送金
		const issuerFamily = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				family: {
					select: { symbolPubKey: true, familyVoiceMosaicId: true },
				},
			},
		});
		const familyPubKey = issuerFamily?.family?.symbolPubKey ?? null;
		const mosaicId = issuerFamily?.family?.familyVoiceMosaicId ?? null;

		if (!familyPubKey || !mosaicId) {
			throw new Error(
				"familyアカウントの情報が不足しているためエスクロー送金できません。",
			);
		}

		const escrowResult = await sendVoiceOnChain(
			issuerPrivateKey,
			familyPubKey,
			mosaicId,
			BigInt(voiceReward),
			`クエスト報酬エスクロー: ${title}`,
		);
		if (!escrowResult.ok) {
			throw new Error(
				`報酬のエスクロー送金に失敗しました: ${escrowResult.message}`,
			);
		}

		const quest = await prisma.$transaction(async (tx: Prisma.TransactionClient) =>
			createQuest(
				{
					userId,
					title,
					detail,
					questType,
					voiceReward,
					issuerUserId: userId,
					targetUserId,
					isResolved: false,
				},
				tx,
			),
		);
		return { quests: [quest] };
	}

	// familyQuest
	if (voiceReward < FAMILY_QUEST_VOICE_MIN || voiceReward > FAMILY_QUEST_VOICE_MAX) {
		throw new Error(
			`familyQuestの報酬は${FAMILY_QUEST_VOICE_MIN}〜${FAMILY_QUEST_VOICE_MAX}で設定してください。`,
		);
	}

	const issuerUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { isFamilyOwner: true, familyId: true },
	});

	if (!issuerUser?.isFamilyOwner) {
		throw new Error("familyQuestはオーナーのみ発行できます。");
	}

	const familyMembers = await prisma.user.findMany({
		where: { familyId: issuerUser.familyId, id: { not: userId } },
		select: { id: true },
	});

	if (familyMembers.length === 0) {
		throw new Error("家族メンバーが存在しません。");
	}

	const quests = await prisma.$transaction(async (tx: Prisma.TransactionClient) =>
		Promise.all(
			familyMembers.map((member) =>
				createQuest(
					{
						userId,
						title,
						detail,
						questType,
						voiceReward,
						issuerUserId: userId,
						targetUserId: member.id,
						isResolved: false,
					},
					tx,
				),
			),
		),
	);

	return { quests };
}
