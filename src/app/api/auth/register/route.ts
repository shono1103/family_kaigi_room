import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { registerFamily } from "@/lib/useCase/registerFamily";

function redirectToSignup(request: Request, error: string) {
	const url = new URL("/login", request.url);
	url.searchParams.set("mode", "signup");
	url.searchParams.set("error", error);
	return NextResponse.redirect(url, { status: 303 });
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

		await createSession(result.ownerUser.id);

		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	} catch (error) {
		const knownError = error as { code?: string } | null;
		if (knownError?.code === "P2002") {
			return redirectToSignup(request, "signup_email_taken");
		}

		console.error("[auth:register] failed to create family", error);
		return redirectToSignup(request, "signup_failed");
	}
}
