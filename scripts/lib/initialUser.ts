import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/lib/auth/password";

let initialUserPromise: Promise<void> | null = null;

function getRequiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`${name} is required to create the initial admin user.`);
	}

	return value;
}

async function ensureInitialUserExistsInternal() {
	const userCount = await prisma.user.count();
	if (userCount > 0) {
		return;
	}

	const initialAdminEmail = getRequiredEnv("INITIAL_ADMIN_EMAIL");
	const initialAdminPassword = getRequiredEnv("INITIAL_ADMIN_PASSWORD");

	try {
		await prisma.user.create({
			data: {
				email: initialAdminEmail,
				passwordHash: hashPassword(initialAdminPassword),
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
