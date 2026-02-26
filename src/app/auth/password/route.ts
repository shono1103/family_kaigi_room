import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAuth } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const newPasswordConfirm = formData.get("newPasswordConfirm");

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof newPasswordConfirm !== "string"
  ) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  if (newPassword !== newPasswordConfirm) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
