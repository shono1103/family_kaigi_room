import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { createDiscussion } from "@/lib/useCase/discussion/createDiscussion";

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

	if (typeof title !== "string" || typeof detail !== "string") {
		return jsonError("入力値が不正です。", 400);
	}

	const normalizedTitle = title.trim();
	const normalizedDetail = detail.trim();

	if (!normalizedTitle || normalizedTitle.length > MAX_TITLE_LENGTH) {
		return jsonError("タイトルは1〜100文字で入力してください。", 400);
	}

	if (!normalizedDetail || normalizedDetail.length > MAX_DETAIL_LENGTH) {
		return jsonError("詳細は1〜1200文字で入力してください。", 400);
	}

	try {
		const created = await createDiscussion({
			userId: auth.user.id,
			title: normalizedTitle,
			detail: normalizedDetail,
		});

		return NextResponse.json({
			ok: true,
			discussion: created.discussion,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		return jsonError(`議論の投稿に失敗しました: ${message}`, 500);
	}
}
