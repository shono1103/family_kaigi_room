import { INTEGRATION_TIMEOUT_MS } from "@/lib/symbol/integration/_helpers/timeout";
import { loadIntegrationEnv } from "@/lib/symbol/integration/_helpers/env";
import { requireEnv } from "@/lib/symbol/integration/_helpers/guards";

describe("symbol ticket CRUD integration", () => {
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
		console.log("[integration:ticket:create] request", {
			metadataSeed,
			metadata: expectedTicketMetadata,
		});
		const { issueTicketOnChain } = await import("@/lib/symbol/useCase/ticket/create");
		const issueResult = await issueTicketOnChain(
			issuerPrivateKey,
			metadataSeed,
			metadataValue,
		);
		console.log("[integration:ticket:create] result", issueResult);
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

		const { getTicketDetails } = await import("@/lib/symbol/useCase/ticket/read");
		console.log("[integration:ticket:read] request", { mosaicIdHex });
		const readResult = await getTicketDetails(mosaicIdHex);
		console.log("[integration:ticket:read] result", readResult);
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
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const metadataSeed = process.env.SYMBOL_TICKET_METADATA_SEED ?? "ticket:info/v1";
		const nextMetadata = {
			name: `integration-updated-${Date.now()}`,
			detail: "integration test ticket (updated)",
			isUsed: true,
		};
		console.log("[integration:ticket:update] request", {
			mosaicIdHex,
			metadataSeed,
			nextMetadata,
		});
		const { updateTicketOnChain } = await import("@/lib/symbol/useCase/ticket/update");
		const updateResult = await updateTicketOnChain(
			issuerPrivateKey,
			metadataSeed,
			mosaicIdHex,
			nextMetadata
		);
		console.log("[integration:ticket:update] result", updateResult);
		if (!updateResult.ok) {
			throw new Error(`[${updateResult.status}] ${updateResult.message}`);
		}
		expect(updateResult.ok).toBe(true);
		expect(updateResult.status).toBe("ok");
		expect(updateResult.mosaicIdHex).toBe(mosaicIdHex);

		const { getTicketDetails } = await import("@/lib/symbol/useCase/ticket/read");
		const readResult = await getTicketDetails(mosaicIdHex);
		expect(readResult.ok).toBe(true);
		if (!readResult.ok) {
			throw new Error(`[${readResult.status}] ${readResult.message}`);
		}
		expect(readResult.ticketMetadata.name).toBe(nextMetadata.name);
		expect(readResult.ticketMetadata.detail).toBe(nextMetadata.detail);
		expect(readResult.ticketMetadata.isUsed).toBe(nextMetadata.isUsed);

		expectedTicketMetadata = nextMetadata;
	}, INTEGRATION_TIMEOUT_MS);

	test("delete: 作成済みmosaicIdを利用してチケットを削除する", async () => {
		const mosaicIdHex = requireIssuedMosaicIdHex();
		const issuerPrivateKey = requireEnv("SYMBOL_ISSUER_PRIVATE_KEY");
		const metadataSeed = process.env.SYMBOL_TICKET_METADATA_SEED ?? "ticket:info/v1";
		console.log("[integration:ticket:delete] request", {
			mosaicIdHex,
			metadataSeed,
		});
		const { deleteTicketOnChain } = await import("@/lib/symbol/useCase/ticket/delete");
		const deleteResult = await deleteTicketOnChain(
			issuerPrivateKey,
			metadataSeed,
			mosaicIdHex
		);
		console.log("[integration:ticket:delete] result", deleteResult);
		if (!deleteResult.ok) {
			throw new Error(`[${deleteResult.status}] ${deleteResult.message}`);
		}
		expect(deleteResult.ok).toBe(true);
		expect(deleteResult.status).toBe("ok");
		expect(deleteResult.mosaicIdHex).toBe(mosaicIdHex);

		const { getTicketDetails } = await import("@/lib/symbol/useCase/ticket/read");
		const readAfterDelete = await getTicketDetails(mosaicIdHex);
		expect(readAfterDelete.ok).toBe(false);
		if (!readAfterDelete.ok) {
			expect(readAfterDelete.status).toBe("invalid_ticket_metadata");
		}
	}, INTEGRATION_TIMEOUT_MS);
});
