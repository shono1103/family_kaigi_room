import { FamilyRole } from "@prisma/client";
import { createFamily, type CreateFamilyInput } from "@/lib/db/family/create";
import type { CreateUserInput } from "@/lib/db/user/create";
import type { CreateUserInfoInput } from "@/lib/db/userInfo/create";
import { prisma } from "@/lib/prisma";
import { facade } from "@/lib/symbol/config";
import { issueFamilyCurrencyOnChain } from "@/lib/symbol/useCase/currency/create";
import { createSymbolAccount } from "@/lib/symbol/useCase/account/create";
import { sendXymOnChain } from "@/lib/symbol/useCase/xymBalance/send";
import { generateAccountFromPrivateKey } from "@/lib/symbol/utils/accounts";
import { registerFamilyUser } from "@/lib/useCase/family/user/register";
import { registerFamilyUserInfo } from "@/lib/useCase/family/user/userInfo/register";

const INITIAL_FAMILY_XYM_AMOUNT_RAW = 1_000_000n;
const FAMILY_CURRENCY_METADATA_SEED =
	process.env.SYMBOL_CURRENCY_METADATA_SEED ?? "currency:info/v1";

export type RegisterFamilyInput = Readonly<{
	familyName: CreateFamilyInput["familyName"];
	userEmail: CreateUserInput["email"];
	userPasswordHash: CreateUserInput["passwordHash"];
	userName?: CreateUserInfoInput["name"];
	userSymbolPrivKey: string;
	familyRole?: FamilyRole;
}>;

export type RegisterFamilyResult = Readonly<{
	family: Awaited<ReturnType<typeof createFamily>>;
	user: Awaited<ReturnType<typeof registerFamilyUser>>;
	userInfo: Awaited<ReturnType<typeof registerFamilyUserInfo>>;
}>;

export async function registerFamily(
	input: RegisterFamilyInput,
): Promise<RegisterFamilyResult> {
	const symbolAccount = createSymbolAccount();
	const userSymbolAccount = generateAccountFromPrivateKey(
		facade,
		input.userSymbolPrivKey,
	);

	const fundResult = await sendXymOnChain(
		input.userSymbolPrivKey,
		symbolAccount.publicKey,
		INITIAL_FAMILY_XYM_AMOUNT_RAW,
		"Initial funding for family symbol account",
	);
	if (!fundResult.ok) {
		throw new Error(
			`Failed to fund family symbol account: [${fundResult.status}] ${fundResult.message}`,
		);
	}

	const issueCurrencyResult = await issueFamilyCurrencyOnChain(
		symbolAccount.privateKey,
		FAMILY_CURRENCY_METADATA_SEED,
		{
			name: `${input.familyName} currency`,
			detail: `Family currency for ${input.familyName}`,
		},
	);
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

		const user = await registerFamilyUser(
			{
				email: input.userEmail,
				passwordHash: input.userPasswordHash,
				familyId: family.id,
				isFamilyOwner: true,
			},
			tx,
		);

		const userInfo = await registerFamilyUserInfo(
			{
				userId: user.id,
				name: input.userName,
				familyRole: input.familyRole ?? FamilyRole.child,
				symbolPubKey: userSymbolAccount.publicKey.toString(),
			},
			tx,
		);

		return {
			family,
			user,
			userInfo,
		};
	});
}
