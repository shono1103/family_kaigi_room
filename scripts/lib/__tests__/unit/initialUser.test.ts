import { beforeEach, describe, expect, test, vi } from "vitest";

const userCountMock = vi.fn();
const hashPasswordMock = vi.fn();
const transactionMock = vi.fn();
const createFamilyMock = vi.fn();
const createUserMock = vi.fn();
const createUserInfoMock = vi.fn();
const createSymbolAccountMock = vi.fn();
const generateAccountFromPrivateKeyMock = vi.fn();
const sendXymOnChainMock = vi.fn();
const issueFamilyVoiceOnChainMock = vi.fn();

vi.mock("../../../../src/lib/prisma", () => ({
	prisma: {
		user: {
			count: userCountMock,
		},
		$transaction: transactionMock,
	},
}));

vi.mock("../../../../src/lib/auth/password", () => ({
	hashPassword: hashPasswordMock,
}));

vi.mock("../../../../src/lib/db/family/create", () => ({
	createFamily: createFamilyMock,
}));

vi.mock("../../../../src/lib/db/user/create", () => ({
	createUser: createUserMock,
}));

vi.mock("../../../../src/lib/db/userInfo/create", () => ({
	createUserInfo: createUserInfoMock,
}));

vi.mock("../../../../src/lib/symbol/config", () => ({
	facade: "facade-mock",
}));

vi.mock("../../../../src/lib/symbol/useCase/account/create", () => ({
	createSymbolAccount: createSymbolAccountMock,
}));

vi.mock("../../../../src/lib/symbol/utils/accounts", () => ({
	generateAccountFromPrivateKey: generateAccountFromPrivateKeyMock,
}));

vi.mock("../../../../src/lib/symbol/useCase/xymBalance/send", () => ({
	sendXymOnChain: sendXymOnChainMock,
}));

vi.mock("../../../../src/lib/symbol/useCase/voice/create", () => ({
	issueFamilyVoiceOnChain: issueFamilyVoiceOnChainMock,
}));

describe("scripts/lib/initialUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		delete process.env.INITIAL_ADMIN_EMAIL;
		delete process.env.INITIAL_ADMIN_PASSWORD;
		delete process.env.INITIAL_ADMIN_SYMBOL_PRIVATE_KEY;
		transactionMock.mockImplementation(async (callback) => callback("tx-mock"));
	});

	test("users が存在する場合は何もしない", async () => {
		userCountMock.mockResolvedValueOnce(1);
		const { ensureInitialUserExists } = await import("../../initialUser");

		await ensureInitialUserExists();

		expect(userCountMock).toHaveBeenCalledTimes(1);
		expect(hashPasswordMock).not.toHaveBeenCalled();
		expect(createFamilyMock).not.toHaveBeenCalled();
	});

	test("users が空の場合は admin ユーザー付き family を作成する", async () => {
		userCountMock.mockResolvedValueOnce(0);
		hashPasswordMock.mockReturnValueOnce("hashed-password");
		process.env.INITIAL_ADMIN_EMAIL = "admin@example.com";
		process.env.INITIAL_ADMIN_PASSWORD = "admin";
		process.env.INITIAL_ADMIN_SYMBOL_PRIVATE_KEY = "issuer-private-key";
		createSymbolAccountMock.mockReturnValueOnce({
			publicKey: "family-public-key",
			privateKey: "family-private-key",
		});
		generateAccountFromPrivateKeyMock.mockReturnValueOnce({
			publicKey: {
				toString: () => "owner-public-key",
			},
		});
		sendXymOnChainMock.mockResolvedValueOnce({
			ok: true,
			status: "ok",
			transactionHash: "hash",
			recipientAddress: "addr",
			amountRaw: "100000000",
		});
		issueFamilyVoiceOnChainMock.mockResolvedValueOnce({
			ok: true,
			mosaicIdHex: "0x0123456789ABCDEF",
		});
		createFamilyMock.mockResolvedValueOnce({
			id: "family-id",
		});
		createUserMock.mockResolvedValueOnce({
			id: "owner-user-id",
		});
		createUserInfoMock.mockResolvedValueOnce({
			userId: "owner-user-id",
		});
		const { ensureInitialUserExists } = await import("../../initialUser");

		await ensureInitialUserExists();

		expect(hashPasswordMock).toHaveBeenCalledWith("admin");
		expect(sendXymOnChainMock).toHaveBeenCalled();
		expect(issueFamilyVoiceOnChainMock).toHaveBeenCalled();
		expect(createFamilyMock).toHaveBeenCalledWith(
			{
				familyName: "Initial Admin Family",
				familyVoiceMosaicId: "0x0123456789ABCDEF",
				symbolPubKey: "family-public-key",
				symbolPrivKey: "family-private-key",
			},
			"tx-mock",
		);
		expect(createUserMock).toHaveBeenCalledWith(
			{
				email: "admin@example.com",
				passwordHash: "hashed-password",
				familyId: "family-id",
				isFamilyOwner: true,
				role: "admin",
			},
			"tx-mock",
		);
		expect(createUserInfoMock).toHaveBeenCalledWith(
			{
				userId: "owner-user-id",
				name: "Initial Admin",
				familyRole: "father",
				symbolPubKey: "owner-public-key",
			},
			"tx-mock",
		);
	});

	test("必要な env がない場合はエラーにする", async () => {
		userCountMock.mockResolvedValueOnce(0);
		const { ensureInitialUserExists } = await import("../../initialUser");

		await expect(ensureInitialUserExists()).rejects.toThrow(
			"INITIAL_ADMIN_EMAIL is required to create the initial admin user.",
		);
	});

	test("初期ユーザー作成の P2002 は握りつぶす", async () => {
		userCountMock.mockResolvedValueOnce(0);
		hashPasswordMock.mockReturnValueOnce("hashed-password");
		process.env.INITIAL_ADMIN_EMAIL = "admin@example.com";
		process.env.INITIAL_ADMIN_PASSWORD = "admin";
		process.env.INITIAL_ADMIN_SYMBOL_PRIVATE_KEY = "issuer-private-key";
		createSymbolAccountMock.mockReturnValueOnce({
			publicKey: "family-public-key",
			privateKey: "family-private-key",
		});
		generateAccountFromPrivateKeyMock.mockReturnValueOnce({
			publicKey: {
				toString: () => "owner-public-key",
			},
		});
		sendXymOnChainMock.mockResolvedValueOnce({
			ok: true,
			status: "ok",
			transactionHash: "hash",
			recipientAddress: "addr",
			amountRaw: "100000000",
		});
		issueFamilyVoiceOnChainMock.mockResolvedValueOnce({
			ok: true,
			mosaicIdHex: "0x0123456789ABCDEF",
		});
		createFamilyMock.mockRejectedValueOnce({ code: "P2002" });
		const { ensureInitialUserExists } = await import("../../initialUser");

		await expect(ensureInitialUserExists()).resolves.toBeUndefined();
	});
});
