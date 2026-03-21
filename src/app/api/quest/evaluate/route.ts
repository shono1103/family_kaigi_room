import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { evaluateQuest } from "@/lib/useCase/quest/evaluateQuest";

function jsonError(message: string, status: number) {
	return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return jsonError("ログインが必要です。", 401);
	}

	const formData = await request.formData();
	const questId = formData.get("questId");
	const evaluationPercentRaw = formData.get("evaluationPercent");

	if (typeof questId !== "string" || typeof evaluationPercentRaw !== "string") {
		return jsonError("入力値が不正です。", 400);
	}

	const normalizedQuestId = questId.trim();
	const evaluationPercent = Number(evaluationPercentRaw);

	if (!normalizedQuestId) {
		return jsonError("questIdが必要です。", 400);
	}

	if (
		!Number.isInteger(evaluationPercent) ||
		evaluationPercent < 0 ||
		evaluationPercent > 100
	) {
		return jsonError("評価は0〜100の整数で指定してください。", 400);
	}

	const result = await evaluateQuest({
		questId: normalizedQuestId,
		evaluatorUserId: auth.user.id,
		evaluationPercent,
	});

	if (!result.ok) {
		return jsonError(result.message, 400);
	}

	return NextResponse.json({
		ok: true,
		rewardSent: result.rewardSent,
		rewardAmount: result.rewardAmount,
		refundAmount: result.refundAmount,
		refundSent: result.refundSent,
	});
}
