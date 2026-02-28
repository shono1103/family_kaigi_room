import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAuth } from "@/lib/auth/session";

export async function POST(request: Request) {
	const auth = await getCurrentAuth();
	if (!auth) {
		return NextResponse.redirect(new URL("/login", request.url), {
			status: 303,
		});
	}

	const formData = await request.formData();
	const name = formData.get("name");
	const symbolPubKey = formData.get("symbolPubKey");

	if (
		typeof name !== "string" ||
		(symbolPubKey !== null && typeof symbolPubKey !== "string")
	) {
		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	}

	const normalizedName = name.trim();
	const normalizedSymbolPubKey = (symbolPubKey ?? "").trim() || null;

	if (!normalizedName) {
		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	}

	try {
		await prisma.userInfo.upsert({
			where: { userId: auth.user.id },
			create: {
				userId: auth.user.id,
				name: normalizedName,
				symbolPubKey: normalizedSymbolPubKey,
				role: "normal",
			},
			update: {
				name: normalizedName,
				symbolPubKey: normalizedSymbolPubKey,
			},
		});
	} catch (error) {
		const knownError = error as { code?: string } | null;
		if (knownError?.code !== "P2002") {
			throw error;
		}
	}

	return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
