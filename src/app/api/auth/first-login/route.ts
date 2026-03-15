import { NextResponse } from "next/server";
import { FamilyRole } from "@prisma/client";
import { getCurrentAuth } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

const SYMBOL_PUBLIC_KEY_REGEX = /^[0-9A-F]{64}$/;

function redirectWithError(request: Request, error: string) {
	const url = new URL("/first-login", request.url);
	url.searchParams.set("error", error);
	return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return NextResponse.redirect(new URL("/login", request.url), {
			status: 303,
		});
	}

	const user = await prisma.user.findUnique({
		where: { id: auth.user.id },
		select: { isFirst: true },
	});

	if (!user?.isFirst) {
		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	}

	const formData = await request.formData();
	const name = formData.get("name");
	const newPassword = formData.get("newPassword");
	const newPasswordConfirm = formData.get("newPasswordConfirm");
	const symbolPubKey = formData.get("symbolPubKey");
	const privateKeySaved = formData.get("privateKeySaved");

	if (
		typeof name !== "string" ||
		typeof newPassword !== "string" ||
		typeof newPasswordConfirm !== "string" ||
		typeof symbolPubKey !== "string"
	) {
		return redirectWithError(request, "invalid_request");
	}

	const normalizedName = name.trim();
	const normalizedSymbolPubKey = symbolPubKey.trim().toUpperCase();

	if (!normalizedName || !newPassword || !newPasswordConfirm) {
		return redirectWithError(request, "invalid_request");
	}

	if (newPassword !== newPasswordConfirm) {
		return redirectWithError(request, "password_mismatch");
	}

	if (privateKeySaved !== "true") {
		return redirectWithError(request, "private_key_not_saved");
	}

	if (!SYMBOL_PUBLIC_KEY_REGEX.test(normalizedSymbolPubKey)) {
		return redirectWithError(request, "invalid_symbol_public_key");
	}

	try {
		await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: auth.user.id },
				data: {
					passwordHash: hashPassword(newPassword),
					isFirst: false,
				},
			});

			await tx.userInfo.upsert({
				where: { userId: auth.user.id },
				create: {
					userId: auth.user.id,
					name: normalizedName,
					symbolPubKey: normalizedSymbolPubKey,
					familyRole: FamilyRole.child,
				},
				update: {
					name: normalizedName,
					symbolPubKey: normalizedSymbolPubKey,
				},
			});
		});
	} catch (error) {
		const knownError = error as { code?: string } | null;
		if (knownError?.code === "P2002") {
			return redirectWithError(request, "setup_failed");
		}
		console.error("[auth:first-login] failed to complete first login setup", error);
		return redirectWithError(request, "setup_failed");
	}

	return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
