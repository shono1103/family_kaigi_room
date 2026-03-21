import { prisma } from "@/lib/prisma";
import { updateQuest } from "@/lib/db/quest/update";
import { sendVoiceOnChain } from "@/lib/symbol/useCase/voice/send";

export type EvaluateQuestInput = Readonly<{
	questId: string;
	evaluatorUserId: string;
	evaluationPercent: number;
}>;

export type EvaluateQuestResult =
	| Readonly<{
			ok: true;
			rewardSent: boolean;
			rewardAmount: number;
			refundAmount: number;
			refundSent: boolean;
	  }>
	| Readonly<{ ok: false; message: string }>;

export async function evaluateQuest(
	input: EvaluateQuestInput,
): Promise<EvaluateQuestResult> {
	const questId = input.questId.trim();
	const evaluatorUserId = input.evaluatorUserId.trim();
	const evaluationPercent = input.evaluationPercent;

	if (!questId) {
		return { ok: false, message: "questIdが必要です。" };
	}

	if (!evaluatorUserId) {
		return { ok: false, message: "evaluatorUserIdが必要です。" };
	}

	if (
		!Number.isInteger(evaluationPercent) ||
		evaluationPercent < 0 ||
		evaluationPercent > 100
	) {
		return { ok: false, message: "評価は0〜100の整数で指定してください。" };
	}

	const quest = await prisma.quest.findUnique({
		where: { id: questId },
	});

	if (!quest) {
		return { ok: false, message: "クエストが見つかりません。" };
	}

	if (quest.issuerUserId !== evaluatorUserId) {
		return { ok: false, message: "クエストの発行者のみ評価できます。" };
	}

	if (quest.evaluationPercent !== null) {
		return { ok: false, message: "このクエストはすでに評価済みです。" };
	}

	const rewardAmount = Math.floor((quest.voiceReward * evaluationPercent) / 100);
	const refundAmount = quest.questType === "personalQuest"
		? quest.voiceReward - rewardAmount
		: 0;

	const issuerUser = await prisma.user.findUnique({
		where: { id: quest.issuerUserId },
		select: { familyId: true },
	});

	const [targetUserInfo, issuerUserInfo, family] = await Promise.all([
		prisma.userInfo.findUnique({
			where: { userId: quest.targetUserId },
			select: { symbolPubKey: true },
		}),
		quest.questType === "personalQuest"
			? prisma.userInfo.findUnique({
					where: { userId: quest.issuerUserId },
					select: { symbolPubKey: true },
				})
			: Promise.resolve(null),
		issuerUser
			? prisma.family.findUnique({
					where: { id: issuerUser.familyId },
					select: { symbolPrivKey: true, familyVoiceMosaicId: true },
				})
			: Promise.resolve(null),
	]);

	const targetPubKey = targetUserInfo?.symbolPubKey ?? null;
	const issuerPubKey = issuerUserInfo?.symbolPubKey ?? null;
	const familyPrivKey = family?.symbolPrivKey ?? null;
	const mosaicId = family?.familyVoiceMosaicId ?? null;

	let rewardSent = false;
	let refundSent = false;

	if (familyPrivKey && mosaicId) {
		if (rewardAmount > 0 && targetPubKey) {
			const sendResult = await sendVoiceOnChain(
				familyPrivKey,
				targetPubKey,
				mosaicId,
				BigInt(rewardAmount),
				`クエスト報酬: ${quest.title}`,
			);
			rewardSent = sendResult.ok;
		}

		if (refundAmount > 0 && issuerPubKey) {
			const refundResult = await sendVoiceOnChain(
				familyPrivKey,
				issuerPubKey,
				mosaicId,
				BigInt(refundAmount),
				`クエスト報酬返金: ${quest.title}`,
			);
			refundSent = refundResult.ok;
		}
	}

	await updateQuest(questId, {
		evaluationPercent,
		isResolved: true,
		isRewarded: rewardSent,
	});

	return { ok: true, rewardSent, rewardAmount, refundAmount, refundSent };
}
