import { NextResponse } from "next/server";
import {
	clearSessionCookie,
	getCurrentAuth,
	revokeSession,
} from "@/lib/auth/session";

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return NextResponse.redirect(new URL("/login", request.url), {
			status: 303,
		});
	}
	const formData = await request.formData();
	const sessionId = formData.get("sessionId");

	if (typeof sessionId === "string" && sessionId) {
		await revokeSession(sessionId, auth.user.id);

		if (sessionId === auth.session.id) {
			await clearSessionCookie();
			return NextResponse.redirect(new URL("/login", request.url), {
				status: 303,
			});
		}
	}

	return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
