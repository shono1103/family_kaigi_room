import { FamilyRole, UserRole } from "@prisma/client";
import { createFamily, type CreateFamilyInput } from "@/lib/db/family/create";
import { createUser, type CreateUserInput } from "@/lib/db/user/create";
import { createUserInfo, type CreateUserInfoInput } from "@/lib/db/userInfo/create";
import { prisma } from "@/lib/prisma";
import { facade } from "@/lib/symbol/config";
import { issueFamilyCurrencyOnChain } from "@/lib/symbol/useCase/currency/create";
import { createSymbolAccount } from "@/lib/symbol/useCase/account/create";
import { sendXymOnChain } from "@/lib/symbol/useCase/xymBalance/send";
import { generateAccountFromPrivateKey } from "@/lib/symbol/utils/accounts";
import type { Prisma } from "@prisma/client";

const INITIAL_FAMILY_XYM_AMOUNT_RAW = 100_000_000n;
const FAMILY_CURRENCY_METADATA_SEED =
	process.env.SYMBOL_CURRENCY_METADATA_SEED ?? "currency:info/v1";

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

	console.log("[usecase:family:register] issueFamilyCurrencyOnChain request", {
		signerPublicKey: symbolAccount.publicKey,
		metadataSeed: FAMILY_CURRENCY_METADATA_SEED,
		metadata: {
			name: `${input.familyName} currency`,
			detail: `Family currency for ${input.familyName}`,
		},
	});
	const issueCurrencyResult = await issueFamilyCurrencyOnChain(
		symbolAccount.privateKey,
		FAMILY_CURRENCY_METADATA_SEED,
		{
			name: `${input.familyName} currency`,
			detail: `Family currency for ${input.familyName}`,
		},
	);
	console.log("[usecase:family:register] issueCurrencyResult", issueCurrencyResult);
	if (!issueCurrencyResult.ok) {
		throw new Error(
			`Failed to issue family currency: [${issueCurrencyResult.error}] ${issueCurrencyResult.message}`,
		);
	}

	return prisma.$transaction(async (tx) => {
		const family = await createFamily(
			{
				familyName: input.familyName,
				currencyMosaicId: issueCurrencyResult.mosaicIdHex,
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
				ownerUserFamilyRole: input.ownerUserFamilyRole ?? FamilyRole.child,
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
