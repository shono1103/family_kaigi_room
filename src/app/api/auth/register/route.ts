import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { registerFamily } from "@/lib/useCase/family/registerFamily";

function redirectToSignup(request: Request, error: string) {
	const url = new URL("/login", request.url);
	url.searchParams.set("mode", "signup");
	url.searchParams.set("error", error);
	return NextResponse.redirect(url, { status: 303 });
}

function resolveSignupUniqueErrorCode(error: {
	code?: string;
	message?: string;
	meta?: { target?: unknown };
} | null) {
	if (error?.message === "ownerUserEmail is already in use") {
		return "signup_email_taken";
	}
	if (error?.message === "ownerUserSymbolPubKey is already in use") {
		return "signup_symbol_pub_key_taken";
	}
	if (error?.code !== "P2002") {
		return null;
	}

	const target = Array.isArray(error.meta?.target)
		? error.meta?.target.filter((value): value is string => typeof value === "string")
		: [];

	if (target.includes("email")) {
		return "signup_email_taken";
	}
	if (target.includes("symbol_pub_key")) {
		return "signup_symbol_pub_key_taken";
	}
	if (target.includes("symbol_priv_key")) {
		return "signup_symbol_priv_key_taken";
	}
	if (target.includes("family_voice_mosaic_id")) {
		return "signup_family_voice_mosaic_taken";
	}

	return "signup_unique_conflict";
}

function resolveSignupFailureErrorCode(error: {
	message?: string;
} | null) {
	const message = error?.message ?? "";

	if (
		message.includes("PrivateKey") ||
		message.includes("private key") ||
		message.includes("invalid private key")
	) {
		return "signup_symbol_invalid";
	}
	if (message.startsWith("Failed to fund family symbol account:")) {
		return "signup_symbol_funding_failed";
	}
	if (message.startsWith("Failed to issue family voice:")) {
		return "signup_symbol_issue_failed";
	}

	return null;
}

export async function POST(request: Request) {
	const formData = await request.formData();
	const familyName = formData.get("familyName");
	const email = formData.get("email");
	const password = formData.get("password");
	const passwordConfirm = formData.get("passwordConfirm");
	const userSymbolPrivKey = formData.get("userSymbolPrivKey");

	if (
		typeof familyName !== "string" ||
		typeof email !== "string" ||
		typeof password !== "string" ||
		typeof passwordConfirm !== "string" ||
		typeof userSymbolPrivKey !== "string"
	) {
		return redirectToSignup(request, "signup_invalid_request");
	}

	const normalizedFamilyName = familyName.trim();
	const normalizedEmail = email.trim().toLowerCase();
	const normalizedUserSymbolPrivKey = userSymbolPrivKey.trim();
	if (
		!normalizedFamilyName ||
		!normalizedEmail ||
		!password ||
		!passwordConfirm ||
		!normalizedUserSymbolPrivKey
	) {
		return redirectToSignup(request, "signup_invalid_request");
	}

	if (password !== passwordConfirm) {
		return redirectToSignup(request, "signup_password_mismatch");
	}

	try {
		const result = await registerFamily({
			familyName: normalizedFamilyName,
			ownerUserEmail: normalizedEmail,
			ownerUserPasswordHash: hashPassword(password),
			ownerUserSymbolPrivKey: normalizedUserSymbolPrivKey,
		});

		try {
			await createSession(result.ownerUser.id);
		} catch (error) {
			console.error("[auth:register] failed to create session", error);
			return redirectToSignup(request, "signup_session_failed");
		}

		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	} catch (error) {
		const knownError = error as {
			code?: string;
			message?: string;
			meta?: { target?: unknown };
		} | null;
		const uniqueErrorCode = resolveSignupUniqueErrorCode(knownError);
		if (uniqueErrorCode) {
			return redirectToSignup(request, uniqueErrorCode);
		}
		const failureErrorCode = resolveSignupFailureErrorCode(knownError);
		if (failureErrorCode) {
			return redirectToSignup(request, failureErrorCode);
		}

		console.error("[auth:register] failed to create family", error);
		return redirectToSignup(request, "signup_failed");
	}
}
