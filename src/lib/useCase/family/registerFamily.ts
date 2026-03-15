import { FamilyRole, UserRole } from "@prisma/client";
import { createFamily, type CreateFamilyInput } from "@/lib/db/family/create";
import { createUser, type CreateUserInput } from "@/lib/db/user/create";
import { createUserInfo, type CreateUserInfoInput } from "@/lib/db/userInfo/create";
import { prisma } from "@/lib/prisma";
import { facade } from "@/lib/symbol/config";
import { issueFamilyVoiceOnChain } from "@/lib/symbol/useCase/voice/create";
import { sendVoiceOnChain } from "@/lib/symbol/useCase/voice/send";
import { createSymbolAccount } from "@/lib/symbol/useCase/account/create";
import { sendXymOnChain } from "@/lib/symbol/useCase/xymBalance/send";
import { generateAccountFromPrivateKey } from "@/lib/symbol/utils/accounts";
import type { Prisma } from "@prisma/client";

const INITIAL_FAMILY_XYM_AMOUNT_RAW = 100_000_000n;
const INITIAL_OWNER_FAMILY_VOICE_AMOUNT_RAW = 10n;

export type RegisterFamilyInput = Readonly<{
	familyName: CreateFamilyInput["familyName"];
	ownerUserEmail: CreateUserInput["email"];
	ownerUserPasswordHash: CreateUserInput["passwordHash"];
	ownerUserName?: CreateUserInfoInput["name"];
	ownerUserSymbolPrivKey: string;
	ownerUserFamilyRole?: FamilyRole;
}>;

export type RegisterFamilyResult = Readonly<{
	family: Awaited<ReturnType<typeof createFamily>>;
	ownerUser: Awaited<ReturnType<typeof registerFamilyOwnerUser>>;
	ownerUserInfo: Awaited<ReturnType<typeof registerFamilyOwnerUserInfo>>;
}>;

export async function registerFamily(
	input: RegisterFamilyInput,
): Promise<RegisterFamilyResult> {
	const symbolAccount = createSymbolAccount();
	const ownerUserSymbolAccount = generateAccountFromPrivateKey(
		facade,
		input.ownerUserSymbolPrivKey,
	);
	await assertRegisterFamilyUniqueInputs({
		ownerUserEmail: input.ownerUserEmail,
		ownerUserSymbolPubKey: ownerUserSymbolAccount.publicKey.toString(),
	});

	console.log("[usecase:family:register] prepared accounts", {
		familyName: input.familyName,
		familySymbolPublicKey: symbolAccount.publicKey,
		ownerUserSymbolPublicKey: ownerUserSymbolAccount.publicKey.toString(),
		initialFamilyXymAmountRaw: INITIAL_FAMILY_XYM_AMOUNT_RAW.toString(),
	});

	const fundResult = await sendXymOnChain(
		input.ownerUserSymbolPrivKey,
		symbolAccount.publicKey,
		INITIAL_FAMILY_XYM_AMOUNT_RAW,
		"Initial funding for family symbol account",
	);
	console.log("[usecase:family:register] fundResult", fundResult);
	if (!fundResult.ok) {
		throw new Error(
			`Failed to fund family symbol account: [${fundResult.status}] ${fundResult.message}`,
		);
	}

	console.log("[usecase:family:register] issueFamilyVoiceOnChain request", {
		signerPublicKey: symbolAccount.publicKey,
	});
	const issueFamilyVoiceResult = await issueFamilyVoiceOnChain(
		symbolAccount.privateKey,
	);
	console.log("[usecase:family:register] issueFamilyVoiceResult", issueFamilyVoiceResult);
	if (!issueFamilyVoiceResult.ok) {
		throw new Error(
			`Failed to issue family voice: [${issueFamilyVoiceResult.error}] ${issueFamilyVoiceResult.message}`,
		);
	}

	const grantVoiceResult = await sendVoiceOnChain(
		symbolAccount.privateKey,
		ownerUserSymbolAccount.publicKey.toString(),
		issueFamilyVoiceResult.mosaicIdHex,
		INITIAL_OWNER_FAMILY_VOICE_AMOUNT_RAW,
		"Initial family voice grant for owner",
	);
	console.log("[usecase:family:register] grantVoiceResult", grantVoiceResult);
	if (!grantVoiceResult.ok) {
		throw new Error(
			`Failed to grant initial family voice to owner: [${grantVoiceResult.status}] ${grantVoiceResult.message}`,
		);
	}

	return prisma.$transaction(async (tx) => {
		const family = await createFamily(
			{
				familyName: input.familyName,
				familyVoiceMosaicId: issueFamilyVoiceResult.mosaicIdHex,
				symbolPubKey: symbolAccount.publicKey,
				symbolPrivKey: symbolAccount.privateKey,
			},
			tx,
		);

		const ownerUser = await registerFamilyOwnerUser(
			{
				email: input.ownerUserEmail,
				passwordHash: input.ownerUserPasswordHash,
				familyId: family.id,
			},
			tx,
		);

		const ownerUserInfo = await registerFamilyOwnerUserInfo(
			{
				ownerUserId: ownerUser.id,
				ownerUserName: input.ownerUserName ?? `${input.familyName} Owner`,
				ownerUserFamilyRole: input.ownerUserFamilyRole ?? FamilyRole.father,
				ownerUserSymbolPubKey: ownerUserSymbolAccount.publicKey.toString(),
			},
			tx,
		);

		return {
			family,
			ownerUser,
			ownerUserInfo,
		};
	});
}

type AssertRegisterFamilyUniqueInputs = Readonly<{
	ownerUserEmail: string;
	ownerUserSymbolPubKey: string;
}>;

async function assertRegisterFamilyUniqueInputs(
	input: AssertRegisterFamilyUniqueInputs,
) {
	const normalizedEmail = input.ownerUserEmail.trim().toLowerCase();
	const normalizedOwnerUserSymbolPubKey = input.ownerUserSymbolPubKey.trim().toUpperCase();

	const [existingUser, existingUserInfo] = await Promise.all([
		prisma.user.findUnique({
			where: { email: normalizedEmail },
			select: { id: true },
		}),
		prisma.userInfo.findUnique({
			where: { symbolPubKey: normalizedOwnerUserSymbolPubKey },
			select: { userId: true },
		}),
	]);

	if (existingUser) {
		throw new Error("ownerUserEmail is already in use");
	}

	if (existingUserInfo) {
		throw new Error("ownerUserSymbolPubKey is already in use");
	}
}



type RegisterFamilyOwnerUserInput = Readonly<{
	email: CreateUserInput["email"];
	passwordHash: CreateUserInput["passwordHash"];
	familyId: CreateUserInput["familyId"];
}>;

async function registerFamilyOwnerUser(
	input: RegisterFamilyOwnerUserInput,
	tx: Prisma.TransactionClient,
) {
	return createUser(
		{
			email: input.email,
			passwordHash: input.passwordHash,
			familyId: input.familyId,
			isFamilyOwner: true,
			isFirst: false,
			role: UserRole.normal,
		},
		tx,
	);
}



type RegisterFamilyOwnerUserInfoInput = Readonly<{
	ownerUserId: CreateUserInfoInput["userId"];
	ownerUserName?: CreateUserInfoInput["name"];
	ownerUserSymbolPubKey?: CreateUserInfoInput["symbolPubKey"];
	ownerUserFamilyRole?: FamilyRole;
}>;

async function registerFamilyOwnerUserInfo(
	input: RegisterFamilyOwnerUserInfoInput,
	tx: Prisma.TransactionClient,
) {
	const normalizedOwnerUserName = input.ownerUserName?.trim();
	if (!normalizedOwnerUserName) {
		return null;
	}

	return createUserInfo(
		{
			userId: input.ownerUserId,
			name: normalizedOwnerUserName,
			familyRole: input.ownerUserFamilyRole ?? FamilyRole.father,
			symbolPubKey: input.ownerUserSymbolPubKey,
		},
		tx,
	);
}
