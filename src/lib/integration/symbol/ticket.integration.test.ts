import { INTEGRATION_TIMEOUT_MS } from "@/lib/integration/_helpers/timeout";
import { loadIntegrationEnv } from "@/lib/integration/_helpers/env";
import { requireEnv } from "@/lib/integration/_helpers/guards";

const shouldRunIntegration = process.env.RUN_SYMBOL_INTEGRATION_TESTS === "true";
const describeIf = shouldRunIntegration ? describe : describe.skip;

describeIf("symbol ticket create integration", () => {
	let issuedMosaicId: string | null = null;

	test("create: issueTicketOnChainでmosaicを発行する", async () => {
		loadIntegrationEnv();
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const metadataSeed = process.env.SYMBOL_TICKET_METADATA_SEED ?? "ticket:info/v1";
		const metadataValue = JSON.stringify({
			name: `integration-${Date.now()}`,
			detail: "integration test ticket",
			isUsed: false,
		});
		const { issueTicketOnChain } = await import("@/lib/symbol/ticket/create");
		const issueResult = await issueTicketOnChain(
			issuerPrivateKey,
			metadataSeed,
			metadataValue,
		);
		expect(issueResult.ok).toBe(true);
		if (!issueResult.ok) {
			throw new Error(issueResult.message);
		}
		issuedMosaicId = issueResult.mosaicId;
		expect(issuedMosaicId).toMatch(/^0x[0-9A-F]{16}$/);
	}, INTEGRATION_TIMEOUT_MS);

	test("read: 作成済みmosaicIdを利用してチケット情報を参照する", async () => {
		expect(issuedMosaicId).toBeTruthy();
		// TODO: read 実装完了後に呼び出しへ差し替える
		// const { readTicketOnChain } = await import("@/lib/symbol/ticket/read");
		// const readResult = await readTicketOnChain(issuedMosaicId!);
		// expect(readResult.ok).toBe(true);
	}, INTEGRATION_TIMEOUT_MS);

	test("update: 作成済みmosaicIdを利用してチケット情報を更新する", async () => {
		expect(issuedMosaicId).toBeTruthy();
		// TODO: update 実装完了後に呼び出しへ差し替える
		// const { updateTicketOnChain } = await import("@/lib/symbol/ticket/update");
		// const updateResult = await updateTicketOnChain(issuedMosaicId!, { ... });
		// expect(updateResult.ok).toBe(true);
	}, INTEGRATION_TIMEOUT_MS);

	test("delete: 作成済みmosaicIdを利用してチケットを削除する", async () => {
		expect(issuedMosaicId).toBeTruthy();
		// TODO: delete 実装完了後に呼び出しへ差し替える
		// const { deleteTicketOnChain } = await import("@/lib/symbol/ticket/delete");
		// const deleteResult = await deleteTicketOnChain(issuedMosaicId!);
		// expect(deleteResult.ok).toBe(true);
	}, INTEGRATION_TIMEOUT_MS);
});
