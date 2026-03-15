import { beforeEach, describe, expect, test, vi } from "vitest";

const createSymbolAccountMock = vi.fn();
const generateAccountFromPrivateKeyMock = vi.fn();
const sendXymOnChainMock = vi.fn();
const issueFamilyVoiceOnChainMock = vi.fn();
const sendVoiceOnChainMock = vi.fn();
const transactionMock = vi.fn();
const userFindUniqueMock = vi.fn();
const userInfoFindUniqueMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
	prisma: {
		user: {
			findUnique: userFindUniqueMock,
		},
		userInfo: {
			findUnique: userInfoFindUniqueMock,
		},
		$transaction: transactionMock,
	},
}));

vi.mock("@/lib/symbol/config", () => ({
	facade: "facade-mock",
}));

vi.mock("@/lib/symbol/useCase/account/create", () => ({
	createSymbolAccount: createSymbolAccountMock,
}));

vi.mock("@/lib/symbol/utils/accounts", () => ({
	generateAccountFromPrivateKey: generateAccountFromPrivateKeyMock,
}));

vi.mock("@/lib/symbol/useCase/xymBalance/send", () => ({
	sendXymOnChain: sendXymOnChainMock,
}));

vi.mock("@/lib/symbol/useCase/voice/create", () => ({
	issueFamilyVoiceOnChain: issueFamilyVoiceOnChainMock,
}));

vi.mock("@/lib/symbol/useCase/voice/send", () => ({
	sendVoiceOnChain: sendVoiceOnChainMock,
}));

vi.mock("@/lib/db/family/create", () => ({
	createFamily: vi.fn(),
}));

vi.mock("@/lib/db/user/create", () => ({
	createUser: vi.fn(),
}));

vi.mock("@/lib/db/userInfo/create", () => ({
	createUserInfo: vi.fn(),
}));

describe("registerFamily unique precheck", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		createSymbolAccountMock.mockReturnValue({
			publicKey: "F".repeat(64),
			privateKey: "E".repeat(64),
		});
		generateAccountFromPrivateKeyMock.mockReturnValue({
			publicKey: {
				toString: () => "A".repeat(64),
			},
		});
		transactionMock.mockImplementation(async (callback) => callback("tx-mock"));
		sendVoiceOnChainMock.mockResolvedValue({
			ok: true,
			status: "ok",
			transactionHash: "voice-hash",
			mosaicIdHex: "0x0123456789ABCDEF",
			amountRaw: "10",
		});
	});

	test("owner email が既に使われている場合は Symbol 処理前に失敗する", async () => {
		userFindUniqueMock.mockResolvedValueOnce({ id: "existing-user-id" });
		userInfoFindUniqueMock.mockResolvedValueOnce(null);

		const { registerFamily } = await import("../../family/registerFamily");

		await expect(
			registerFamily({
				familyName: "Test Family",
				ownerUserEmail: "existing@example.com",
				ownerUserPasswordHash: "hashed-password",
				ownerUserSymbolPrivKey: "B".repeat(64),
			}),
		).rejects.toThrow("ownerUserEmail is already in use");

		expect(sendXymOnChainMock).not.toHaveBeenCalled();
		expect(issueFamilyVoiceOnChainMock).not.toHaveBeenCalled();
	});

	test("owner symbol public key が既に使われている場合は Symbol 処理前に失敗する", async () => {
		userFindUniqueMock.mockResolvedValueOnce(null);
		userInfoFindUniqueMock.mockResolvedValueOnce({ userId: "existing-user-info-id" });

		const { registerFamily } = await import("../../family/registerFamily");

		await expect(
			registerFamily({
				familyName: "Test Family",
				ownerUserEmail: "new@example.com",
				ownerUserPasswordHash: "hashed-password",
				ownerUserSymbolPrivKey: "B".repeat(64),
			}),
		).rejects.toThrow("ownerUserSymbolPubKey is already in use");

		expect(sendXymOnChainMock).not.toHaveBeenCalled();
		expect(issueFamilyVoiceOnChainMock).not.toHaveBeenCalled();
	});
});
