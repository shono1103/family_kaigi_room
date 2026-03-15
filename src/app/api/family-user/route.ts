import { NextResponse } from "next/server";
import { FamilyRole } from "@prisma/client";
import { getCurrentAuth } from "@/lib/auth/session";
import { createFamilyUser } from "@/lib/useCase/createFamilyUser";

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
	const name = formData.get("name");
	const familyRole = formData.get("familyRole");

	if (
		typeof email !== "string" ||
		typeof name !== "string" ||
		typeof familyRole !== "string"
	) {
		return jsonError("入力値が不正です。", 400);
	}

	const normalizedEmail = email.trim().toLowerCase();
	const normalizedName = name.trim();

	if (!normalizedEmail) {
		return jsonError("メールアドレスを入力してください。", 400);
	}

	if (!normalizedName) {
		return jsonError("名前を入力してください。", 400);
	}

	if (!Object.values(FamilyRole).includes(familyRole as FamilyRole)) {
		return jsonError("familyRole が不正です。", 400);
	}

	try {
		const result = await createFamilyUser({
			requesterUserId: auth.user.id,
			email: normalizedEmail,
			name: normalizedName,
			familyRole: familyRole as FamilyRole,
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
			message === "only family owner can create family user" ||
			message === "email is already in use"
		) {
			return jsonError(message, 400);
		}
		return jsonError(`家族ユーザーの作成に失敗しました: ${message}`, 500);
	}
}
