import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { issueQuest } from "@/lib/useCase/quest/issueQuest";

const MAX_TITLE_LENGTH = 100;
const MAX_DETAIL_LENGTH = 1200;

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
	const targetUserId = formData.get("targetUserId");

	if (
		typeof title !== "string" ||
		typeof detail !== "string" ||
		typeof targetUserId !== "string"
	) {
		return jsonError("入力値が不正です。", 400);
	}

	const normalizedTitle = title.trim();
	const normalizedDetail = detail.trim();
	const normalizedTargetUserId = targetUserId.trim();

	if (!normalizedTitle || normalizedTitle.length > MAX_TITLE_LENGTH) {
		return jsonError("タイトルは1〜100文字で入力してください。", 400);
	}

	if (!normalizedDetail || normalizedDetail.length > MAX_DETAIL_LENGTH) {
		return jsonError("詳細は1〜1200文字で入力してください。", 400);
	}

	if (!normalizedTargetUserId) {
		return jsonError("対象ユーザーを選択してください。", 400);
	}

	if (normalizedTargetUserId === auth.user.id) {
		return jsonError("自分自身は対象ユーザーに指定できません。", 400);
	}

	const [issuerUser, targetUser] = await Promise.all([
		prisma.user.findUnique({
			where: { id: auth.user.id },
			select: { familyId: true },
		}),
		prisma.user.findUnique({
			where: { id: normalizedTargetUserId },
			select: { familyId: true },
		}),
	]);

	if (!issuerUser || !targetUser || issuerUser.familyId !== targetUser.familyId) {
		return jsonError("対象ユーザーの指定が不正です。", 400);
	}

	try {
		const issued = await issueQuest({
			userId: auth.user.id,
			targetUserId: normalizedTargetUserId,
			title: normalizedTitle,
			detail: normalizedDetail,
		});

		return NextResponse.json({
			ok: true,
			quest: issued.quest,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		return jsonError(
			`クエストの発行に失敗しました: ${message}`,
			500,
		);
	}
}
