import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAuth } from "@/lib/auth/session";
import { readSymbolAccountByPublicKey } from "@/lib/symbol/useCase/account/read";

function redirectWithError(request: Request, errorCode: string) {
	const url = new URL("/", request.url);
	url.searchParams.set("error", errorCode);
	return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
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
	const rawSymbolPubKey = symbolPubKey?.trim() ?? "";
	let normalizedSymbolPubKey: string | null = null;

	if (!normalizedName) {
		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	}

	if (rawSymbolPubKey) {
		const accountReadResult = await readSymbolAccountByPublicKey(rawSymbolPubKey);
		if (!accountReadResult.ok) {
			if (accountReadResult.status === "invalid_public_key") {
				return redirectWithError(request, "invalid_symbol_pub_key");
			}
			return redirectWithError(request, "symbol_node_unreachable");
		}
		if (accountReadResult.existence === "not_found") {
			return redirectWithError(request, "symbol_account_not_found");
		}

		normalizedSymbolPubKey = accountReadResult.publicKey;
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
