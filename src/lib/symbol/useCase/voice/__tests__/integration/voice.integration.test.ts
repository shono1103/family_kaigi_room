import { INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/symbol/timeout";
import { loadIntegrationEnv } from "@/lib/testing/integration/symbol/env";
import { requireEnv } from "@/lib/testing/integration/symbol/guards";

describe("symbol voice create integration", () => {
	let issuedMosaicIdHex: string | null = null;
	let issuerPublicKey: string | null = null;
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

	test("create: issueFamilyVoiceOnChainでfamily voice mosaicを発行する", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const { facade } = await import("@/lib/symbol/config");
		const { generateAccountFromPrivateKey } = await import("@/lib/symbol/utils/accounts");
		const issuerAccount = generateAccountFromPrivateKey(facade, issuerPrivateKey);
		const options = {
			initialSupply: 1000n,
			divisibility: 0,
		};

		console.log("[integration:voice:create] request", {
			options: {
				initialSupply: options.initialSupply.toString(),
				divisibility: options.divisibility,
			},
		});

		const { issueFamilyVoiceOnChain } = await import("@/lib/symbol/useCase/voice/create");
		const issueResult = await issueFamilyVoiceOnChain(
			issuerPrivateKey,
			options,
		);
		console.log("[integration:voice:create] result", issueResult);

		expect(issueResult.ok).toBe(true);
		if (!issueResult.ok) {
			throw new Error(issueResult.message);
		}
		issuedMosaicIdHex = issueResult.mosaicIdHex;
		issuerPublicKey = issuerAccount.publicKey.toString();
		expectedCurrentSupplyRaw = options.initialSupply.toString();
		expectedIssuerOwnedAmountRaw = options.initialSupply.toString();
		expect(issueResult.mosaicIdHex).toMatch(/^0x[0-9A-F]{16}$/);

		const { nodeUrl } = await import("@/lib/symbol/config");
		const { getMosaic } = await import("@/lib/symbol/utils/node-client");
		const mosaicWithMetadata = await getMosaic(nodeUrl, issueResult.mosaicIdHex);

		console.log("[integration:voice:create:readback] result", {
			mosaic: mosaicWithMetadata.mosaic,
		});

		expect(mosaicWithMetadata.mosaic).toBeTruthy();
	}, INTEGRATION_TIMEOUT_MS);

	test("read: 特定アカウントの特定mosaic_idの状態を取得する", async () => {
		const publicKey = requireIssuerPublicKey();
		const mosaicIdHex = requireIssuedMosaicIdHex();
		expect(expectedCurrentSupplyRaw).not.toBeNull();
		if (!expectedCurrentSupplyRaw) {
			throw new Error("expected voice state is null. create test must run first.");
		}

		const { getVoiceDetailsByPublicKey } = await import("@/lib/symbol/useCase/voice/read");
		console.log("[integration:voice:read] request", { publicKey, mosaicIdHex });
		const readResult = await getVoiceDetailsByPublicKey(publicKey, mosaicIdHex);
		console.log("[integration:voice:read] result", readResult);

		expect(readResult.ok).toBe(true);
		if (!readResult.ok) {
			throw new Error(`[${readResult.status}] ${readResult.message}`);
		}

		expect(readResult.status).toBe("ok");
		expect(readResult.publicKey).toBe(publicKey);
		expect(readResult.mosaicIdHex).toBe(mosaicIdHex);
		expect(readResult.ownershipStatus).toBe("owned");
		expect(readResult.amountRaw).toBe(expectedIssuerOwnedAmountRaw);
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
		const { updateFamilyVoiceSupplyOnChain } = await import("@/lib/symbol/useCase/voice/update");
		console.log("[integration:voice:update] request", {
			mosaicIdHex,
			nextSupply: nextSupply.toString(),
		});
		const updateResult = await updateFamilyVoiceSupplyOnChain(
			issuerPrivateKey,
			mosaicIdHex,
			nextSupply,
		);
		console.log("[integration:voice:update] result", updateResult);

		expect(updateResult.ok).toBe(true);
		if (!updateResult.ok) {
			throw new Error(`[${updateResult.status}] ${updateResult.message}`);
		}

		expect(updateResult.status).toBe("ok");
		expect(updateResult.mosaicIdHex).toBe(mosaicIdHex);
		expect(updateResult.previousSupplyRaw).toBe(expectedCurrentSupplyRaw);
		expect(updateResult.currentSupplyRaw).toBe(nextSupply.toString());

		const { getVoiceDetailsByPublicKey } = await import("@/lib/symbol/useCase/voice/read");
		const readResult = await getVoiceDetailsByPublicKey(publicKey, mosaicIdHex);
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

		const { sendVoiceOnChain } = await import("@/lib/symbol/useCase/voice/send");
		console.log("[integration:voice:send] request", {
			recipientPublicKey,
			mosaicIdHex,
			amountRaw: sendAmountRaw.toString(),
		});
		const sendResult = await sendVoiceOnChain(
			issuerPrivateKey,
			recipientPublicKey,
			mosaicIdHex,
			sendAmountRaw,
			"integration test voice transfer",
		);
		console.log("[integration:voice:send] result", sendResult);

		expect(sendResult.ok).toBe(true);
		if (!sendResult.ok) {
			throw new Error(`[${sendResult.status}] ${sendResult.message}`);
		}

		expect(sendResult.status).toBe("ok");
		expect(sendResult.transactionHash).toMatch(/^[0-9A-F]{64}$/);
		expect(sendResult.mosaicIdHex).toBe(mosaicIdHex);
		expect(sendResult.amountRaw).toBe(sendAmountRaw.toString());

		const { getVoiceDetailsByPublicKey } = await import("@/lib/symbol/useCase/voice/read");
		const recipientReadResult = await getVoiceDetailsByPublicKey(
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

		const issuerReadResult = await getVoiceDetailsByPublicKey(
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
