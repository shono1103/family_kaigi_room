import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAuth } from "@/lib/auth/session";

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return NextResponse.redirect(new URL("/login", request.url), {
			status: 303,
		});
	}

	const formData = await request.formData();
	const email = formData.get("email");

	if (typeof email !== "string") {
		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	}

	const normalizedEmail = email.trim().toLowerCase();
	if (!normalizedEmail) {
		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	}

	try {
		await prisma.user.update({
			where: { id: auth.user.id },
			data: { email: normalizedEmail },
		});
	} catch (error) {
		const knownError = error as { code?: string } | null;
		if (knownError?.code !== "P2002") {
			throw error;
		}
	}

	return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
