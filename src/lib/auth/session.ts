import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const AUTH_SESSION_COOKIE_NAME = "auth_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 7;

export type ActiveSessionItem = {
	id: string;
	createdAt: Date;
	expiresAt: Date;
};

export type AuthContext = {
	user: {
		id: string;
		email: string;
	};
	session: {
		id: string;
		createdAt: Date;
		expiresAt: Date;
	};
};

function hashSessionToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

function createRawSessionToken(): string {
	return randomBytes(32).toString("base64url");
}

function buildSessionExpiryDate() {
	return new Date(Date.now() + SESSION_TTL_MS);
}

async function setSessionCookie(token: string, expiresAt: Date) {
	const cookieStore = await cookies();
	cookieStore.set(AUTH_SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		expires: expiresAt,
	});
}

export async function clearSessionCookie() {
	const cookieStore = await cookies();
	cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
}

export async function createSession(userId: string) {
	const token = createRawSessionToken();
	const tokenHash = hashSessionToken(token);
	const expiresAt = buildSessionExpiryDate();

	const session = await prisma.session.create({
		data: {
			userId,
			tokenHash,
			expiresAt,
		},
		select: {
			id: true,
			createdAt: true,
			expiresAt: true,
		},
	});

	await setSessionCookie(token, expiresAt);

	return session;
}

export async function revokeSession(sessionId: string, userId: string) {
	const result = await prisma.session.updateMany({
		where: {
			id: sessionId,
			userId,
			revokedAt: null,
		},
		data: {
			revokedAt: new Date(),
		},
	});

	return result.count > 0;
}

export async function revokeCurrentSession() {
	const auth = await getCurrentAuth();
	if (!auth) {
		await clearSessionCookie();
		return;
	}

	await revokeSession(auth.session.id, auth.user.id);
	await clearSessionCookie();
}

export async function listActiveSessions(
	userId: string,
): Promise<ActiveSessionItem[]> {
	return prisma.session.findMany({
		where: {
			userId,
			revokedAt: null,
			expiresAt: {
				gt: new Date(),
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			createdAt: true,
			expiresAt: true,
		},
	});
}

export async function getCurrentAuth(): Promise<AuthContext | null> {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

	if (!sessionToken) {
		return null;
	}

	const tokenHash = hashSessionToken(sessionToken);
	const now = new Date();

	const session = await prisma.session.findUnique({
		where: {
			tokenHash,
		},
		select: {
			id: true,
			createdAt: true,
			expiresAt: true,
			revokedAt: true,
			user: {
				select: {
					id: true,
					email: true,
				},
			},
		},
	});

	if (!session || session.revokedAt || session.expiresAt <= now) {
		await clearSessionCookie();
		return null;
	}

	if (
		session.expiresAt.getTime() - now.getTime() <
		SESSION_REFRESH_THRESHOLD_MS
	) {
		const refreshedExpiry = buildSessionExpiryDate();
		await prisma.session.update({
			where: {
				id: session.id,
			},
			data: {
				expiresAt: refreshedExpiry,
			},
		});
		await setSessionCookie(sessionToken, refreshedExpiry);
		session.expiresAt = refreshedExpiry;
	}

	return {
		user: session.user,
		session: {
			id: session.id,
			createdAt: session.createdAt,
			expiresAt: session.expiresAt,
		},
	};
}

export async function requireAuth() {
	const auth = await getCurrentAuth();
	if (!auth) {
		redirect("/login");
	}

	return auth;
}
