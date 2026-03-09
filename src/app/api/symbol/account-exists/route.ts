import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { readSymbolAccountByPublicKey } from "@/lib/symbol/useCase/account/read";

export async function GET(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}

	const url = new URL(request.url);
	const rawPublicKey = url.searchParams.get("publicKey");
	const accountReadResult = await readSymbolAccountByPublicKey(rawPublicKey);

	if (!accountReadResult.ok && accountReadResult.status === "invalid_public_key") {
		return NextResponse.json(
			{ error: "invalid_symbol_pub_key" },
			{ status: 400 },
		);
	}

	if (!accountReadResult.ok) {
		return NextResponse.json({ result: "unreachable" });
	}

	return NextResponse.json({ result: accountReadResult.existence });
}
