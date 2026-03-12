import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/lib/auth/password";

// These are intentional defaults for initial setup, similar to GitLab or Redmine.
// This project assumes local operation and is not intended for public exposure.
// See README for details on the initial admin credentials.
const INITIAL_ADMIN_EMAIL = "admin@example.com";
const INITIAL_ADMIN_PASSWORD = "admin";

let initialUserPromise: Promise<void> | null = null;

async function ensureInitialUserExistsInternal() {
	const userCount = await prisma.user.count();
	if (userCount > 0) {
		return;
	}

	try {
		await prisma.user.create({
			data: {
				email: INITIAL_ADMIN_EMAIL,
				passwordHash: hashPassword(INITIAL_ADMIN_PASSWORD),
				role: "admin",
				isFamilyOwner: true,
				family: {
					create: {
						familyName: "Initial Admin Family",
					},
				},
			},
		});
	} catch (error) {
		// Another request/process may have created the initial user concurrently.
		const knownError = error as { code?: string } | null;
		if (knownError?.code !== "P2002") {
			throw error;
		}
	}
}

export async function ensureInitialUserExists() {
	if (!initialUserPromise) {
		initialUserPromise = ensureInitialUserExistsInternal().finally(() => {
			initialUserPromise = null;
		});
	}

	await initialUserPromise;
}
