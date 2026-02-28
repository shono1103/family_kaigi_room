import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAuth } from "@/lib/auth/session";

const PUBLIC_KEY_REGEX = /^[0-9A-F]{64}$/;
const SYMBOL_ACCOUNT_REQUEST_TIMEOUT_MS = 3000;

function getSymbolNodeUrlList(): string[] {
	const network = process.env.SYMBOL_NETWORK;
	const list =
		network === "mainnet"
			? process.env.SYMBOL_MAINNET_NODE_URL_LIST
			: process.env.SYMBOL_TESTNET_NODE_URL_LIST;

	return (list ?? "")
		.split(",")
		.map((url) => url.trim())
		.filter(Boolean);
}

async function hasSymbolAccount(publicKey: string): Promise<boolean | null> {
	const nodeUrlList = getSymbolNodeUrlList();

	for (const nodeUrl of nodeUrlList) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
		}, SYMBOL_ACCOUNT_REQUEST_TIMEOUT_MS);

		try {
			const response = await fetch(
				`${nodeUrl.replace(/\/$/, "")}/accounts/${publicKey}`,
				{
					method: "GET",
					cache: "no-store",
					signal: controller.signal,
				},
			);

			if (response.status === 200) {
				return true;
			}

			if (response.status === 404) {
				return false;
			}
		} catch {
			// try next node
		} finally {
			clearTimeout(timeoutId);
		}
	}

	return null;
}

function redirectWithError(request: Request, errorCode: string) {
	const url = new URL("/", request.url);
	url.searchParams.set("error", errorCode);
	return NextResponse.redirect(url, { status: 303 });
}

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
	const normalizedSymbolPubKey =
		(symbolPubKey ?? "").trim().toUpperCase() || null;

	if (!normalizedName) {
		return NextResponse.redirect(new URL("/", request.url), {
			status: 303,
		});
	}

	if (normalizedSymbolPubKey && !PUBLIC_KEY_REGEX.test(normalizedSymbolPubKey)) {
		return redirectWithError(request, "invalid_symbol_pub_key");
	}

	if (normalizedSymbolPubKey) {
		const accountExists = await hasSymbolAccount(normalizedSymbolPubKey);
		if (accountExists === false) {
			return redirectWithError(request, "symbol_account_not_found");
		}
		if (accountExists === null) {
			return redirectWithError(request, "symbol_node_unreachable");
		}
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
