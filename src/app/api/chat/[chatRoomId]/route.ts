import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { listChatMessages } from "@/lib/useCase/discussion/listChatMessages";
import { postChatMessage } from "@/lib/useCase/discussion/postChatMessage";

function jsonError(message: string, status: number) {
	return NextResponse.json({ ok: false, message }, { status });
}

type RouteContext = { params: Promise<{ chatRoomId: string }> };

export async function GET(_request: Request, context: RouteContext) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) return jsonError("ログインが必要です。", 401);

	const { chatRoomId } = await context.params;

	try {
		const messages = await listChatMessages(chatRoomId, auth.user.id);
		return NextResponse.json({ ok: true, messages });
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		if (message === "access denied") return jsonError("アクセス権限がありません。", 403);
		if (message === "chat room not found") return jsonError("チャットルームが見つかりません。", 404);
		return jsonError(`メッセージの取得に失敗しました: ${message}`, 500);
	}
}

export async function POST(request: Request, context: RouteContext) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) return jsonError("ログインが必要です。", 401);

	const { chatRoomId } = await context.params;
	const formData = await request.formData();
	const content = formData.get("content");

	if (typeof content !== "string" || !content.trim()) {
		return jsonError("メッセージを入力してください。", 400);
	}

	try {
		const message = await postChatMessage({
			chatRoomId,
			userId: auth.user.id,
			content: content.trim(),
		});
		return NextResponse.json({ ok: true, message });
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		if (message === "access denied") return jsonError("アクセス権限がありません。", 403);
		return jsonError(`メッセージの送信に失敗しました: ${message}`, 500);
	}
}
