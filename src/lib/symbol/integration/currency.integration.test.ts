import { INTEGRATION_TIMEOUT_MS } from "@/lib/symbol/integration/_helpers/timeout";
import { loadIntegrationEnv } from "@/lib/symbol/integration/_helpers/env";
import { requireEnv } from "@/lib/symbol/integration/_helpers/guards";

describe("symbol currency create integration", () => {
	let issuedMosaicIdHex: string | null = null;
	let issuerPublicKey: string | null = null;
	let expectedMetadata: { name: string; detail: string } | null = null;
	let expectedCurrentSupplyRaw: string | null = null;
	let expectedIssuerOwnedAmountRaw: string | null = null;

	const requireIssuedMosaicIdHex = (): string => {
		expect(issuedMosaicIdHex).not.toBeNull();
		if (!issuedMosaicIdHex) {
			throw new Error("issuedMosaicIdHex is null. create test must run first.");
		}
		return issuedMosaicIdHex;
	};

	const requireIssuerPublicKey = (): string => {
		expect(issuerPublicKey).not.toBeNull();
		if (!issuerPublicKey) {
			throw new Error("issuerPublicKey is null. create test must run first.");
		}
		return issuerPublicKey;
	};

	beforeAll(() => {
		loadIntegrationEnv();
	});

	test("create: issueFamilyCurrencyOnChainで家族通貨mosaicを発行する", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const { facade } = await import("@/lib/symbol/config");
		const { generateAccountFromPrivateKey } = await import("@/lib/symbol/utils/accounts");
		const issuerAccount = generateAccountFromPrivateKey(facade, issuerPrivateKey);
		const metadataSeed = process.env.SYMBOL_CURRENCY_METADATA_SEED ?? "currency:info/v1";
		const metadata = {
			name: `family-currency-${Date.now()}`,
			detail: "integration test family currency",
		};
		const options = {
			initialSupply: 1000n,
			divisibility: 0,
		};

		console.log("[integration:currency:create] request", {
			metadataSeed,
			metadata,
			options: {
				initialSupply: options.initialSupply.toString(),
				divisibility: options.divisibility,
			},
		});

		const { issueFamilyCurrencyOnChain } = await import("@/lib/symbol/useCase/currency/create");
		const issueResult = await issueFamilyCurrencyOnChain(
			issuerPrivateKey,
			metadataSeed,
			metadata,
			options,
		);
		console.log("[integration:currency:create] result", issueResult);

		expect(issueResult.ok).toBe(true);
		if (!issueResult.ok) {
			throw new Error(issueResult.message);
		}
		issuedMosaicIdHex = issueResult.mosaicIdHex;
		issuerPublicKey = issuerAccount.publicKey.toString();
		expectedMetadata = metadata;
		expectedCurrentSupplyRaw = options.initialSupply.toString();
		expectedIssuerOwnedAmountRaw = options.initialSupply.toString();
		expect(issueResult.mosaicIdHex).toMatch(/^0x[0-9A-F]{16}$/);

		const { nodeUrl } = await import("@/lib/symbol/config");
		const { getMosaicWithMetadata } = await import("@/lib/symbol/utils/node-client");
		const mosaicWithMetadata = await getMosaicWithMetadata(nodeUrl, issueResult.mosaicIdHex);

		console.log("[integration:currency:create:readback] result", {
			mosaic: mosaicWithMetadata.mosaic,
			metadataEntriesCount: mosaicWithMetadata.metadataEntries.length,
		});

		expect(mosaicWithMetadata.mosaic).toBeTruthy();
		expect(Array.isArray(mosaicWithMetadata.metadataEntries)).toBe(true);
		expect(mosaicWithMetadata.metadataEntries.length).toBeGreaterThan(0);
	}, INTEGRATION_TIMEOUT_MS);

	test("read: 特定アカウントの特定mosaic_idの状態を取得する", async () => {
		const publicKey = requireIssuerPublicKey();
		const mosaicIdHex = requireIssuedMosaicIdHex();
		expect(expectedMetadata).not.toBeNull();
		expect(expectedCurrentSupplyRaw).not.toBeNull();
		if (!expectedMetadata || !expectedCurrentSupplyRaw) {
			throw new Error("expected currency state is null. create test must run first.");
		}

		const { getCurrencyDetailsByPublicKey } = await import("@/lib/symbol/useCase/currency/read");
		console.log("[integration:currency:read] request", { publicKey, mosaicIdHex });
		const readResult = await getCurrencyDetailsByPublicKey(publicKey, mosaicIdHex);
		console.log("[integration:currency:read] result", readResult);

		expect(readResult.ok).toBe(true);
		if (!readResult.ok) {
			throw new Error(`[${readResult.status}] ${readResult.message}`);
		}

		expect(readResult.status).toBe("ok");
		expect(readResult.publicKey).toBe(publicKey);
		expect(readResult.mosaicIdHex).toBe(mosaicIdHex);
		expect(readResult.ownershipStatus).toBe("owned");
		expect(readResult.amountRaw).toBe(expectedIssuerOwnedAmountRaw);
		expect(readResult.currencyMetadata.name).toBe(expectedMetadata.name);
		expect(readResult.currencyMetadata.detail).toBe(expectedMetadata.detail);
		expect(Array.isArray(readResult.metadataEntries)).toBe(true);
		expect(readResult.metadataEntries.length).toBeGreaterThan(0);
		expect(readResult.mosaic).toBeTruthy();
	}, INTEGRATION_TIMEOUT_MS);

	test("update: 作成済みmosaicの供給量を更新する", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const publicKey = requireIssuerPublicKey();
		const mosaicIdHex = requireIssuedMosaicIdHex();
		expect(expectedCurrentSupplyRaw).not.toBeNull();
		if (!expectedCurrentSupplyRaw) {
			throw new Error("expectedCurrentSupplyRaw is null. create test must run first.");
		}

		const nextSupply = BigInt(expectedCurrentSupplyRaw) + 250n;
		const { updateFamilyCurrencySupplyOnChain } = await import("@/lib/symbol/useCase/currency/update");
		console.log("[integration:currency:update] request", {
			mosaicIdHex,
			nextSupply: nextSupply.toString(),
		});
		const updateResult = await updateFamilyCurrencySupplyOnChain(
			issuerPrivateKey,
			mosaicIdHex,
			nextSupply,
		);
		console.log("[integration:currency:update] result", updateResult);

		expect(updateResult.ok).toBe(true);
		if (!updateResult.ok) {
			throw new Error(`[${updateResult.status}] ${updateResult.message}`);
		}

		expect(updateResult.status).toBe("ok");
		expect(updateResult.mosaicIdHex).toBe(mosaicIdHex);
		expect(updateResult.previousSupplyRaw).toBe(expectedCurrentSupplyRaw);
		expect(updateResult.currentSupplyRaw).toBe(nextSupply.toString());

		const { getCurrencyDetailsByPublicKey } = await import("@/lib/symbol/useCase/currency/read");
		const readResult = await getCurrencyDetailsByPublicKey(publicKey, mosaicIdHex);
		expect(readResult.ok).toBe(true);
		if (!readResult.ok) {
			throw new Error(`[${readResult.status}] ${readResult.message}`);
		}

		expect(readResult.ownershipStatus).toBe("owned");
		expect(readResult.amountRaw).toBe(nextSupply.toString());

		expectedCurrentSupplyRaw = nextSupply.toString();
		expectedIssuerOwnedAmountRaw = nextSupply.toString();
	}, INTEGRATION_TIMEOUT_MS);

	test("send: 作成済みmosaicを別アカウントへ送金する", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const issuerPk = requireIssuerPublicKey();
		const mosaicIdHex = requireIssuedMosaicIdHex();
		expect(expectedIssuerOwnedAmountRaw).not.toBeNull();
		if (!expectedIssuerOwnedAmountRaw) {
			throw new Error("expectedIssuerOwnedAmountRaw is null. create test must run first.");
		}

		const sendAmountRaw = 1n;
		const { facade } = await import("@/lib/symbol/config");
		const { createNewSymbolAccount } = await import("@/lib/symbol/utils/accounts");
		const recipientAccount = createNewSymbolAccount(facade);
		const recipientPublicKey = recipientAccount.publicKey.toString();

		const { sendCurrencyOnChain } = await import("@/lib/symbol/useCase/currency/send");
		console.log("[integration:currency:send] request", {
			recipientPublicKey,
			mosaicIdHex,
			amountRaw: sendAmountRaw.toString(),
		});
		const sendResult = await sendCurrencyOnChain(
			issuerPrivateKey,
			recipientPublicKey,
			mosaicIdHex,
			sendAmountRaw,
			"integration test currency transfer",
		);
		console.log("[integration:currency:send] result", sendResult);

		expect(sendResult.ok).toBe(true);
		if (!sendResult.ok) {
			throw new Error(`[${sendResult.status}] ${sendResult.message}`);
		}

		expect(sendResult.status).toBe("ok");
		expect(sendResult.transactionHash).toMatch(/^[0-9A-F]{64}$/);
		expect(sendResult.mosaicIdHex).toBe(mosaicIdHex);
		expect(sendResult.amountRaw).toBe(sendAmountRaw.toString());

		const { getCurrencyDetailsByPublicKey } = await import("@/lib/symbol/useCase/currency/read");
		const recipientReadResult = await getCurrencyDetailsByPublicKey(
			recipientPublicKey,
			mosaicIdHex,
		);
		expect(recipientReadResult.ok).toBe(true);
		if (!recipientReadResult.ok) {
			throw new Error(`[${recipientReadResult.status}] ${recipientReadResult.message}`);
		}

		expect(recipientReadResult.publicKey).toBe(recipientPublicKey);
		expect(recipientReadResult.ownershipStatus).toBe("owned");
		expect(recipientReadResult.amountRaw).toBe(sendAmountRaw.toString());
		expect(recipientReadResult.currencyMetadata.name).toBe(expectedMetadata?.name);
		expect(recipientReadResult.currencyMetadata.detail).toBe(expectedMetadata?.detail);

		const issuerReadResult = await getCurrencyDetailsByPublicKey(
			issuerPk,
			mosaicIdHex,
		);
		expect(issuerReadResult.ok).toBe(true);
		if (!issuerReadResult.ok) {
			throw new Error(`[${issuerReadResult.status}] ${issuerReadResult.message}`);
		}

		const expectedIssuerNextAmountRaw = (
			BigInt(expectedIssuerOwnedAmountRaw) - sendAmountRaw
		).toString();
		expect(issuerReadResult.amountRaw).toBe(expectedIssuerNextAmountRaw);
		expectedIssuerOwnedAmountRaw = expectedIssuerNextAmountRaw;
	}, INTEGRATION_TIMEOUT_MS);
});
