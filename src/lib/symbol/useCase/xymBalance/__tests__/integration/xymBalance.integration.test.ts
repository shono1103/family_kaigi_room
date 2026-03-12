import { INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/symbol/timeout";
import { loadIntegrationEnv } from "@/lib/testing/integration/symbol/env";
import { requireEnv } from "@/lib/testing/integration/symbol/guards";

describe("symbol xymBalance integration", () => {
	beforeAll(() => {
		loadIntegrationEnv();
	});

	test("read: invalid public key を渡すと invalid_public_key を返す", async () => {
		const { readXymBalanceByPublicKey } = await import("@/lib/symbol/useCase/xymBalance/read");
		const result = await readXymBalanceByPublicKey("invalid-public-key");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe("invalid_public_key");
			expect(typeof result.message).toBe("string");
		}
	}, INTEGRATION_TIMEOUT_MS);

	test("read: 有効な公開鍵を渡すと残高情報を返す", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const { facade } = await import("@/lib/symbol/config");
		const { generateAccountFromPrivateKey } = await import("@/lib/symbol/utils/accounts");
		const issuerAccount = generateAccountFromPrivateKey(facade, issuerPrivateKey);
		const issuerPublicKey = issuerAccount.publicKey.toString();

		const { readXymBalanceByPublicKey } = await import("@/lib/symbol/useCase/xymBalance/read");
		console.log("[integration:xymBalance:read:ok] request", { issuerPublicKey });
		const result = await readXymBalanceByPublicKey(issuerPublicKey);
		console.log("[integration:xymBalance:read:ok] result", result);

		if (!result.ok) {
			throw new Error(`[${result.status}] ${result.message}`);
		}
		expect(result.ok).toBe(true);
		expect(result.status).toBe("ok");
		expect(result.publicKey).toBe(issuerPublicKey);
		expect(result.balance.currencyMosaicId).toMatch(/^[0-9A-F]{16}$/);
		expect(typeof result.balance.divisibility).toBe("number");
		expect(result.balance.amountRaw).toMatch(/^\d+$/);
		expect(typeof result.balance.amountDisplay).toBe("string");
	}, INTEGRATION_TIMEOUT_MS);

	test("send: invalid amount を渡すと invalid_amount を返す", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const { facade } = await import("@/lib/symbol/config");
		const { generateAccountFromPrivateKey } = await import("@/lib/symbol/utils/accounts");
		const issuerAccount = generateAccountFromPrivateKey(facade, issuerPrivateKey);
		const issuerPublicKey = issuerAccount.publicKey.toString();

		const { sendXymOnChain } = await import("@/lib/symbol/useCase/xymBalance/send");
		const result = await sendXymOnChain(issuerPrivateKey, issuerPublicKey, 0n);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe("invalid_amount");
			expect(typeof result.message).toBe("string");
		}
	}, INTEGRATION_TIMEOUT_MS);

	test("send: 有効な条件で少額送金すると transactionHash を返す", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const { facade } = await import("@/lib/symbol/config");
		const { generateAccountFromPrivateKey } = await import("@/lib/symbol/utils/accounts");
		const issuerAccount = generateAccountFromPrivateKey(facade, issuerPrivateKey);
		const issuerPublicKey = issuerAccount.publicKey.toString();
		const amountRaw = 1n;

		const { sendXymOnChain } = await import("@/lib/symbol/useCase/xymBalance/send");
		console.log("[integration:xymBalance:send:ok] request", {
			recipientPublicKey: issuerPublicKey,
			amountRaw: amountRaw.toString(),
		});
		const sendResult = await sendXymOnChain(
			issuerPrivateKey,
			issuerPublicKey,
			amountRaw,
			"integration test xym transfer",
		);
		console.log("[integration:xymBalance:send:ok] result", sendResult);

		if (!sendResult.ok) {
			throw new Error(`[${sendResult.status}] ${sendResult.message}`);
		}
		expect(sendResult.ok).toBe(true);
		expect(sendResult.status).toBe("ok");
		expect(sendResult.transactionHash).toMatch(/^[0-9A-F]{64}$/);
		expect(sendResult.recipientAddress.length).toBeGreaterThan(0);
		expect(sendResult.amountRaw).toBe(amountRaw.toString());
	}, INTEGRATION_TIMEOUT_MS);
});
