import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

function redirectWithError(request: Request, error: string) {
	const url = new URL("/login", request.url);
	url.searchParams.set("error", error);
	return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
	const formData = await request.formData();
	const email = formData.get("email");
	const password = formData.get("password");

	if (typeof email !== "string" || typeof password !== "string") {
		return redirectWithError(request, "invalid_request");
	}

	const normalizedEmail = email.trim().toLowerCase();
	if (!normalizedEmail || !password) {
		return redirectWithError(request, "invalid_request");
	}

	const user = await prisma.user.findUnique({
		where: {
			email: normalizedEmail,
		},
		select: {
			id: true,
			passwordHash: true,
		},
	});

	if (!user || !verifyPassword(password, user.passwordHash)) {
		return redirectWithError(request, "invalid_credentials");
	}

	await createSession(user.id);

	return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
