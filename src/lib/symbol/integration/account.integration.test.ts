import { INTEGRATION_TIMEOUT_MS } from "@/lib/symbol/integration/_helpers/timeout";
import { loadIntegrationEnv } from "@/lib/symbol/integration/_helpers/env";
import { requireEnv } from "@/lib/symbol/integration/_helpers/guards";

describe("symbol account read integration", () => {
	beforeAll(() => {
		loadIntegrationEnv();
	});

	test("invalid public key を渡すと invalid_public_key を返す", async () => {
		const { readSymbolAccountByPublicKey } = await import("@/lib/symbol/useCase/account/read");
		const result = await readSymbolAccountByPublicKey("invalid-public-key");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe("invalid_public_key");
			expect(typeof result.message).toBe("string");
		}
	}, INTEGRATION_TIMEOUT_MS);

	test("有効な公開鍵を渡すと account existence を返す", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const { facade } = await import("@/lib/symbol/config");
		const { generateAccountFromPrivateKey } = await import("@/lib/symbol/utils/accounts");
		const issuerAccount = generateAccountFromPrivateKey(facade, issuerPrivateKey);
		const issuerPublicKey = issuerAccount.publicKey.toString();

		console.log("[integration:account:read] request", { issuerPublicKey });
		const { readSymbolAccountByPublicKey } = await import("@/lib/symbol/useCase/account/read");
		const result = await readSymbolAccountByPublicKey(issuerPublicKey);
		console.log("[integration:account:read] result", result);

		if (!result.ok) {
			throw new Error(`[${result.status}] ${result.message}`);
		}
		expect(result.ok).toBe(true);
		expect(result.status).toBe("ok");
		expect(result.publicKey).toBe(issuerPublicKey);
		expect(["exists", "not_found"]).toContain(result.existence);
	}, INTEGRATION_TIMEOUT_MS);
});
