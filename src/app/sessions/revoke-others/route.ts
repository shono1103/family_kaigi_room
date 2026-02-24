import { NextResponse } from "next/server";
import { getCurrentAuth, revokeOtherSessions } from "@/lib/auth/session";

export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }
  await revokeOtherSessions(auth.user.id, auth.session.id);

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
