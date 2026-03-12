import { FamilyRole, UserRole } from "@prisma/client";
import { readFamilyById } from "@/lib/db/family/read";
import { cleanupFamiliesByIds, cleanupFamiliesByNames } from "@/lib/testing/integration/db/family";
import { createIntegrationSuffix } from "@/lib/testing/integration/db/ids";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import { cleanupUsersByEmails } from "@/lib/testing/integration/db/user";
import { cleanupUserInfosBySymbolPubKeys } from "@/lib/testing/integration/db/userInfo";
import { readUserById } from "@/lib/db/user/read";
import { readUserInfoByUserId } from "@/lib/db/userInfo/read";
import { INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/symbol/timeout";
import { loadIntegrationEnv } from "@/lib/testing/integration/symbol/env";
import { requireEnv } from "@/lib/testing/integration/symbol/guards";
import { facade } from "@/lib/symbol/config";
import { getCurrencyDetailsByPublicKey } from "@/lib/symbol/useCase/currency/read";
import { normalizeMosaicIdHex } from "@/lib/symbol/utils/normalizers";
import { generateAccountFromPrivateKey } from "@/lib/symbol/utils/accounts";
import { registerFamily } from "@/lib/useCase/family/register";

describe("family register use case integration", () => {
	const createdFamilyIds: string[] = [];
	let lastFamilyName: string | null = null;
	let lastUserEmail: string | null = null;
	let lastUserSymbolPubKey: string | null = null;

	beforeAll(() => {
		loadIntegrationEnv();
		ensureDbIntegrationEnv();
	});

	afterEach(async () => {
		await cleanupUserInfosBySymbolPubKeys(lastUserSymbolPubKey ? [lastUserSymbolPubKey] : []);
		await cleanupUsersByEmails(lastUserEmail ? [lastUserEmail] : []);
		await cleanupFamiliesByNames(lastFamilyName ? [lastFamilyName] : []);
		lastFamilyName = null;
		lastUserEmail = null;
		lastUserSymbolPubKey = null;
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("registerFamily: family / owner user / userInfo / family currency を作成できる", async () => {
		const suffix = createIntegrationSuffix();
		const familyName = `integration-family-room-${suffix}`;
		const userEmail = `integration-family-${suffix}@example.com`;
		const userPasswordHash = `integration-password-hash-${suffix}`;
		const userName = `integration-user-${suffix}`;
		const userSymbolPrivKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const userSymbolAccount = generateAccountFromPrivateKey(facade, userSymbolPrivKey);
		lastFamilyName = familyName;
		lastUserEmail = userEmail;
		lastUserSymbolPubKey = userSymbolAccount.publicKey.toString();

		console.log("[integration:family:register] request", {
			familyName,
			userEmail,
			userName,
			userSymbolPublicKey: userSymbolAccount.publicKey.toString(),
		});

		const result = await registerFamily({
			familyName,
			userEmail,
			userPasswordHash,
			userName,
			userSymbolPrivKey,
			familyRole: FamilyRole.father,
		});
		console.log("[integration:family:register] result", {
			familyId: result.family.id,
			familySymbolPubKey: result.family.symbolPubKey,
			currencyMosaicId: result.family.currencyMosaicId,
			userId: result.user.id,
			userInfoUserId: result.userInfo?.userId ?? null,
		});

		createdFamilyIds.push(result.family.id);

		expect(result.family.familyName).toBe(familyName);
		expect(result.family.symbolPubKey).toMatch(/^[0-9A-F]{64}$/);
		expect(result.family.symbolPrivKey).toMatch(/^[0-9A-F]{64}$/);
		expect(result.family.currencyMosaicId).toMatch(/^[0-9A-F]{16}$/);

		expect(result.user.familyId).toBe(result.family.id);
		expect(result.user.email).toBe(userEmail);
		expect(result.user.passwordHash).toBe(userPasswordHash);
		expect(result.user.isFamilyOwner).toBe(true);
		expect(result.user.role).toBe(UserRole.normal);

		expect(result.userInfo).not.toBeNull();
		expect(result.userInfo?.userId).toBe(result.user.id);
		expect(result.userInfo?.name).toBe(userName);
		expect(result.userInfo?.familyRole).toBe(FamilyRole.father);
		expect(result.userInfo?.symbolPubKey).toBe(userSymbolAccount.publicKey.toString());

		const persistedFamily = await readFamilyById(result.family.id);
		const persistedUser = await readUserById(result.user.id);
		const persistedUserInfo = await readUserInfoByUserId(result.user.id);

		expect(persistedFamily?.id).toBe(result.family.id);
		expect(persistedUser?.id).toBe(result.user.id);
		expect(persistedUserInfo?.userId).toBe(result.user.id);

		const currencyReadResult = await getCurrencyDetailsByPublicKey(
			result.family.symbolPubKey ?? "",
			result.family.currencyMosaicId,
		);
		expect(currencyReadResult.ok).toBe(true);
		if (!currencyReadResult.ok) {
			throw new Error(`[${currencyReadResult.status}] ${currencyReadResult.message}`);
		}

		expect(currencyReadResult.publicKey).toBe(result.family.symbolPubKey);
		expect(normalizeMosaicIdHex(currencyReadResult.mosaicIdHex)).toBe(
			normalizeMosaicIdHex(result.family.currencyMosaicId),
		);
		expect(currencyReadResult.ownershipStatus).toBe("owned");
		expect(currencyReadResult.currencyMetadata.name).toBe(`${familyName} currency`);
		expect(currencyReadResult.currencyMetadata.detail).toBe(`Family currency for ${familyName}`);
	}, INTEGRATION_TIMEOUT_MS);
});
