import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { issueQuest } from "@/lib/useCase/quest/issueQuest";
import type { QuestType } from "@prisma/client";

const MAX_TITLE_LENGTH = 100;
const MAX_DETAIL_LENGTH = 1200;
const PERSONAL_QUEST_VOICE_MIN = 1;
const PERSONAL_QUEST_VOICE_MAX = 5;
const FAMILY_QUEST_VOICE_MIN = 1;
const FAMILY_QUEST_VOICE_MAX = 100;

function jsonError(message: string, status: number) {
	return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return jsonError("ログインが必要です。", 401);
	}

	const formData = await request.formData();
	const title = formData.get("title");
	const detail = formData.get("detail");
	const questTypeRaw = formData.get("questType");
	const voiceRewardRaw = formData.get("voiceReward");
	const targetUserIdRaw = formData.get("targetUserId");
	const issuerPrivateKeyRaw = formData.get("issuerPrivateKey");

	if (
		typeof title !== "string" ||
		typeof detail !== "string" ||
		typeof questTypeRaw !== "string" ||
		typeof voiceRewardRaw !== "string"
	) {
		return jsonError("入力値が不正です。", 400);
	}

	const normalizedTitle = title.trim();
	const normalizedDetail = detail.trim();
	const questType = questTypeRaw.trim() as QuestType;

	if (!normalizedTitle || normalizedTitle.length > MAX_TITLE_LENGTH) {
		return jsonError("タイトルは1〜100文字で入力してください。", 400);
	}

	if (!normalizedDetail || normalizedDetail.length > MAX_DETAIL_LENGTH) {
		return jsonError("詳細は1〜1200文字で入力してください。", 400);
	}

	if (questType !== "personalQuest" && questType !== "familyQuest") {
		return jsonError("クエスト種別が不正です。", 400);
	}

	const voiceReward = Number(voiceRewardRaw);
	if (
		!Number.isInteger(voiceReward) ||
		(questType === "personalQuest" &&
			(voiceReward < PERSONAL_QUEST_VOICE_MIN || voiceReward > PERSONAL_QUEST_VOICE_MAX)) ||
		(questType === "familyQuest" &&
			(voiceReward < FAMILY_QUEST_VOICE_MIN || voiceReward > FAMILY_QUEST_VOICE_MAX))
	) {
		const range =
			questType === "personalQuest"
				? `${PERSONAL_QUEST_VOICE_MIN}〜${PERSONAL_QUEST_VOICE_MAX}`
				: `${FAMILY_QUEST_VOICE_MIN}〜${FAMILY_QUEST_VOICE_MAX}`;
		return jsonError(`報酬は${range}のvoiceで設定してください。`, 400);
	}

	if (questType === "familyQuest") {
		const issuerUser = await prisma.user.findUnique({
			where: { id: auth.user.id },
			select: { isFamilyOwner: true },
		});
		if (!issuerUser?.isFamilyOwner) {
			return jsonError("familyQuestはオーナーのみ発行できます。", 403);
		}

		try {
			const issued = await issueQuest({
				userId: auth.user.id,
				questType,
				voiceReward,
				title: normalizedTitle,
				detail: normalizedDetail,
			});
			return NextResponse.json({ ok: true, quests: issued.quests });
		} catch (error) {
			const message = error instanceof Error ? error.message : "unknown error";
			return jsonError(`クエストの発行に失敗しました: ${message}`, 500);
		}
	}

	// personalQuest
	const targetUserId = typeof targetUserIdRaw === "string" ? targetUserIdRaw.trim() : "";
	const issuerPrivateKey =
		typeof issuerPrivateKeyRaw === "string" ? issuerPrivateKeyRaw.trim() : "";

	if (!targetUserId) {
		return jsonError("対象ユーザーを選択してください。", 400);
	}

	if (targetUserId === auth.user.id) {
		return jsonError("自分自身は対象ユーザーに指定できません。", 400);
	}

	if (!issuerPrivateKey) {
		return jsonError("あなたのSymbol秘密鍵を入力してください。", 400);
	}

	const [issuerUser, targetUser] = await Promise.all([
		prisma.user.findUnique({
			where: { id: auth.user.id },
			select: { familyId: true },
		}),
		prisma.user.findUnique({
			where: { id: targetUserId },
			select: { familyId: true },
		}),
	]);

	if (!issuerUser || !targetUser || issuerUser.familyId !== targetUser.familyId) {
		return jsonError("対象ユーザーの指定が不正です。", 400);
	}

	try {
		const issued = await issueQuest({
			userId: auth.user.id,
			questType,
			voiceReward,
			targetUserId,
			title: normalizedTitle,
			detail: normalizedDetail,
			issuerPrivateKey,
		});
		return NextResponse.json({ ok: true, quest: issued.quests[0] });
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		return jsonError(`クエストの発行に失敗しました: ${message}`, 500);
	}
}
