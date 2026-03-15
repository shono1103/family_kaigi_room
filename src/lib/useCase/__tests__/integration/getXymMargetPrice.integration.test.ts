import { describe, expect, test } from "vitest";
import { getXymMargetPrice } from "@/lib/useCase/getXymMargetPrice";
import { INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/symbol/timeout";

describe("getXymMargetPrice use case integration", () => {
	test("CoinGecko から日本円の XYM 相場を取得できる", async () => {
		const result = await getXymMargetPrice();

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error(`[${result.status}] ${result.message}`);
		}
		expect(result.status).toBe("ok");
		expect(Number.isFinite(result.jpy)).toBe(true);
		expect(result.jpy).toBeGreaterThan(0);
		if (result.usd !== null) {
			expect(Number.isFinite(result.usd)).toBe(true);
			expect(result.usd).toBeGreaterThan(0);
		}
	}, INTEGRATION_TIMEOUT_MS);
});
