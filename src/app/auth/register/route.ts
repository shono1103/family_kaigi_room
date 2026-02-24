import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

function redirectToSignup(request: Request, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("mode", "signup");
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const passwordConfirm = formData.get("passwordConfirm");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof passwordConfirm !== "string"
  ) {
    return redirectToSignup(request, "signup_invalid_request");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password || !passwordConfirm) {
    return redirectToSignup(request, "signup_invalid_request");
  }

  if (password !== passwordConfirm) {
    return redirectToSignup(request, "signup_password_mismatch");
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
      },
    });

    await createSession(user.id);

    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  } catch (error) {
    const knownError = error as { code?: string } | null;
    if (knownError?.code === "P2002") {
      return redirectToSignup(request, "signup_email_taken");
    }

    throw error;
  }
}

