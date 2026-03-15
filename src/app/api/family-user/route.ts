import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { addUser } from "@/lib/useCase/addUser";

function jsonError(message: string, status: number) {
	return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return jsonError("ログインが必要です。", 401);
	}

	const formData = await request.formData();
	const email = formData.get("email");

	if (typeof email !== "string") {
		return jsonError("入力値が不正です。", 400);
	}

	const normalizedEmail = email.trim().toLowerCase();
	if (!normalizedEmail) {
		return jsonError("メールアドレスを入力してください。", 400);
	}

	try {
		const result = await addUser({
			requesterUserId: auth.user.id,
			email: normalizedEmail,
		});

		return NextResponse.json({
			ok: true,
			user: {
				id: result.user.id,
				email: result.user.email,
			},
			initialPassword: result.initialPassword,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		if (
			message === "only family owner can add user" ||
			message === "email is already in use"
		) {
			return jsonError(message, 400);
		}
		return jsonError(`家族ユーザーの作成に失敗しました: ${message}`, 500);
	}
}
