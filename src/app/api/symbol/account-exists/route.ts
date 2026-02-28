import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import {
	checkSymbolAccountExistenceByPublicKey,
	isValidSymbolPublicKey,
	normalizeSymbolPublicKey,
} from "@/lib/symbol/account";

export async function GET(request: Request) {
	const auth = await getCurrentAuth();
	if (!auth) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}

	const url = new URL(request.url);
	const publicKey = normalizeSymbolPublicKey(url.searchParams.get("publicKey"));
	if (!publicKey || !isValidSymbolPublicKey(publicKey)) {
		return NextResponse.json(
			{ error: "invalid_symbol_pub_key" },
			{ status: 400 },
		);
	}

	const result = await checkSymbolAccountExistenceByPublicKey(publicKey);
	return NextResponse.json({ result });
}
