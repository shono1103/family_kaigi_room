import { UserRole } from "@prisma/client";
import { createFamily } from "../../src/lib/db/family/create";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/lib/auth/password";
import { createUser } from "../../src/lib/db/user/create";
import { createUserInfo } from "../../src/lib/db/userInfo/create";
import { facade } from "../../src/lib/symbol/config";
import { createSymbolAccount } from "../../src/lib/symbol/useCase/account/create";
import { issueFamilyVoiceOnChain } from "../../src/lib/symbol/useCase/voice/create";
import { sendXymOnChain } from "../../src/lib/symbol/useCase/xymBalance/send";
import { generateAccountFromPrivateKey } from "../../src/lib/symbol/utils/accounts";
import type { Prisma } from "@prisma/client";

let initialUserPromise: Promise<void> | null = null;
const INITIAL_FAMILY_NAME = "Initial Admin Family";
const INITIAL_FAMILY_XYM_AMOUNT_RAW = 100_000_000n;
const INITIAL_ADMIN_NAME = "Initial Admin";

function getRequiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`${name} is required to create the initial admin user.`);
	}

	return value;
}

async function registerInitialAdminUser(
	familyId: string,
	initialAdminEmail: string,
	initialAdminPassword: string,
	tx: Prisma.TransactionClient,
) {
	return createUser(
		{
			email: initialAdminEmail,
			passwordHash: hashPassword(initialAdminPassword),
			familyId,
			isFamilyOwner: true,
			role: UserRole.admin,
		},
		tx,
	);
}

async function registerInitialAdminUserInfo(
	ownerUserId: string,
	ownerUserSymbolPubKey: string,
	tx: Prisma.TransactionClient,
) {
	return createUserInfo(
		{
			userId: ownerUserId,
			name: INITIAL_ADMIN_NAME,
			familyRole: "father",
			symbolPubKey: ownerUserSymbolPubKey,
		},
		tx,
	);
}

async function registerInitialAdminFamily() {
	const initialAdminEmail = getRequiredEnv("INITIAL_ADMIN_EMAIL");
	const initialAdminPassword = getRequiredEnv("INITIAL_ADMIN_PASSWORD");
	const initialAdminSymbolPrivKey = getRequiredEnv(
		"INITIAL_ADMIN_SYMBOL_PRIVATE_KEY",
	);
	const familySymbolAccount = createSymbolAccount();
	const initialAdminSymbolAccount = generateAccountFromPrivateKey(
		facade,
		initialAdminSymbolPrivKey,
	);

	try {
		const fundResult = await sendXymOnChain(
			initialAdminSymbolPrivKey,
			familySymbolAccount.publicKey,
			INITIAL_FAMILY_XYM_AMOUNT_RAW,
			"Initial funding for family symbol account",
		);
		if (!fundResult.ok) {
			throw new Error(
				`Failed to fund family symbol account: [${fundResult.status}] ${fundResult.message}`,
			);
		}

		const issueVoiceResult = await issueFamilyVoiceOnChain(
			familySymbolAccount.privateKey,
		);
		if (!issueVoiceResult.ok) {
			throw new Error(
				`Failed to issue family voice: [${issueVoiceResult.error}] ${issueVoiceResult.message}`,
			);
		}

		const result = await prisma.$transaction(async (tx) => {
			const family = await createFamily(
				{
					familyName: INITIAL_FAMILY_NAME,
					familyVoiceMosaicId: issueVoiceResult.mosaicIdHex,
					symbolPubKey: familySymbolAccount.publicKey,
					symbolPrivKey: familySymbolAccount.privateKey,
				},
				tx,
			);
			const ownerUser = await registerInitialAdminUser(
				family.id,
				initialAdminEmail,
				initialAdminPassword,
				tx,
			);

			const ownerUserInfo = await registerInitialAdminUserInfo(
				ownerUser.id,
				initialAdminSymbolAccount.publicKey.toString(),
				tx,
			);

			return {
				family,
				ownerUser,
				ownerUserInfo,
			};
		});

	} catch (error) {
		// Another request/process may have created the initial user concurrently.
		const knownError = error as { code?: string } | null;
		if (knownError?.code !== "P2002") {
			throw error;
		}
	}
}

async function ensureInitialUserExistsInternal() {
	const userCount = await prisma.user.count();
	if (userCount > 0) {
		return;
	}

	await registerInitialAdminFamily();
}

export async function ensureInitialUserExists() {
	if (!initialUserPromise) {
		initialUserPromise = ensureInitialUserExistsInternal().finally(() => {
			initialUserPromise = null;
		});
	}

	await initialUserPromise;
}
