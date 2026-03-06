import { INTEGRATION_TIMEOUT_MS } from "@/lib/symbol/integration/_helpers/timeout";
import { loadIntegrationEnv } from "@/lib/symbol/integration/_helpers/env";
import { requireEnv } from "@/lib/symbol/integration/_helpers/guards";

describe("symbol ticket create integration", () => {
	let issuedMosaicIdHex: string | null = null;
	let expectedTicketMetadata: { name: string; detail: string; isUsed: boolean } | null = null;

	const requireIssuedMosaicIdHex = (): string => {
		expect(issuedMosaicIdHex).not.toBeNull();
		if (!issuedMosaicIdHex) {
			throw new Error("issuedMosaicIdHex is null. create test must run first.");
		}
		return issuedMosaicIdHex;
	};

	beforeAll(() => {
		loadIntegrationEnv();
	});

	test("create: issueTicketOnChainでmosaicを発行する", async () => {
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const metadataSeed = process.env.SYMBOL_TICKET_METADATA_SEED ?? "ticket:info/v1";
		expectedTicketMetadata = {
			name: `integration-${Date.now()}`,
			detail: "integration test ticket",
			isUsed: false,
		};
		const metadataValue = JSON.stringify(expectedTicketMetadata);
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
		issuedMosaicIdHex = issueResult.mosaicIdHex;
		expect(issuedMosaicIdHex).toMatch(/^0x[0-9A-F]{16}$/);
	}, INTEGRATION_TIMEOUT_MS);

	test("read: 作成済みmosaicIdを利用してチケット情報を参照する", async () => {
		const mosaicIdHex = requireIssuedMosaicIdHex();
		expect(expectedTicketMetadata).not.toBeNull();
		if (!expectedTicketMetadata) {
			throw new Error("expectedTicketMetadata is null. create test must run first.");
		}

		const {getTicketDetails} = await import("@/lib/symbol/ticket/read");
		const readResult = await getTicketDetails(mosaicIdHex);
		if (!readResult.ok) {
			throw new Error(`[${readResult.status}] ${readResult.message}`);
		}
		expect(readResult.ok).toBe(true);
		expect(readResult.status).toBe("ok");
		expect(readResult.ticketMetadata.name).toBe(expectedTicketMetadata.name);
		expect(readResult.ticketMetadata.detail).toBe(expectedTicketMetadata.detail);
		expect(readResult.ticketMetadata.isUsed).toBe(expectedTicketMetadata.isUsed);
		expect(Array.isArray(readResult.metadataEntries)).toBe(true);
		expect(readResult.mosaic).toBeTruthy();

	}, INTEGRATION_TIMEOUT_MS);

	test("update: 作成済みmosaicIdを利用してチケット情報を更新する", async () => {
		const mosaicIdHex = requireIssuedMosaicIdHex();
		// TODO: update 実装完了後に呼び出しへ差し替える
		// const { updateTicketOnChain } = await import("@/lib/symbol/ticket/update");
		// const updateResult = await updateTicketOnChain(mosaicIdHex, { ... });
		// expect(updateResult.ok).toBe(true);
	}, INTEGRATION_TIMEOUT_MS);

	test("delete: 作成済みmosaicIdを利用してチケットを削除する", async () => {
		const mosaicIdHex = requireIssuedMosaicIdHex();
		// TODO: delete 実装完了後に呼び出しへ差し替える
		// const { deleteTicketOnChain } = await import("@/lib/symbol/ticket/delete");
		// const deleteResult = await deleteTicketOnChain(mosaicIdHex);
		// expect(deleteResult.ok).toBe(true);
	}, INTEGRATION_TIMEOUT_MS);
});
