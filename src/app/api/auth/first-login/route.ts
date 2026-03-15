import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { completeFirstLogin } from "@/lib/useCase/user/firstLogin";

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return NextResponse.json(
			{ ok: false, redirectTo: "/login" },
			{ status: 401 },
		);
	}

	const user = await prisma.user.findUnique({
		where: { id: auth.user.id },
		select: { isFirst: true },
	});

	if (!user?.isFirst) {
		return NextResponse.json(
			{ ok: false, redirectTo: "/" },
			{ status: 400 },
		);
	}

	const formData = await request.formData();
	const newPassword = formData.get("newPassword");
	const newPasswordConfirm = formData.get("newPasswordConfirm");

	if (
		typeof newPassword !== "string" ||
		typeof newPasswordConfirm !== "string"
	) {
		return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
	}

	if (!newPassword || !newPasswordConfirm) {
		return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
	}

	const result = await completeFirstLogin({
		userId: auth.user.id,
		newPassword,
		newPasswordConfirm,
	});

	if (!result.ok) {
		return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
	}

	return NextResponse.json(
		{ ok: true, symbolAccount: result.symbolAccount },
		{ status: 200 },
	);
}
