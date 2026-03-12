import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";

const userCountMock = vi.fn();
const hashPasswordMock = vi.fn();
const registerFamilyMock = vi.fn();

vi.mock("../../../../src/lib/prisma", () => ({
	prisma: {
		user: {
			count: userCountMock,
		},
	},
}));

vi.mock("../../../../src/lib/auth/password", () => ({
	hashPassword: hashPasswordMock,
}));

vi.mock("../../../../src/lib/useCase/family/register", () => ({
	registerFamily: registerFamilyMock,
}));

describe("scripts/lib/initialUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		delete process.env.INITIAL_ADMIN_EMAIL;
		delete process.env.INITIAL_ADMIN_PASSWORD;
		delete process.env.INITIAL_ADMIN_SYMBOL_PRIVATE_KEY;
	});

	test("users が存在する場合は何もしない", async () => {
		userCountMock.mockResolvedValueOnce(1);
		const { ensureInitialUserExists } = await import("../../initialUser");

		await ensureInitialUserExists();

		expect(userCountMock).toHaveBeenCalledTimes(1);
		expect(hashPasswordMock).not.toHaveBeenCalled();
		expect(registerFamilyMock).not.toHaveBeenCalled();
	});

	test("users が空の場合は admin ユーザー付き family を作成する", async () => {
		userCountMock.mockResolvedValueOnce(0);
		hashPasswordMock.mockReturnValueOnce("hashed-password");
		process.env.INITIAL_ADMIN_EMAIL = "admin@example.com";
		process.env.INITIAL_ADMIN_PASSWORD = "admin";
		process.env.INITIAL_ADMIN_SYMBOL_PRIVATE_KEY = "issuer-private-key";
		const { ensureInitialUserExists } = await import("../../initialUser");

		await ensureInitialUserExists();

		expect(hashPasswordMock).toHaveBeenCalledWith("admin");
		expect(registerFamilyMock).toHaveBeenCalledWith({
			familyName: "Initial Admin Family",
			userEmail: "admin@example.com",
			userPasswordHash: "hashed-password",
			userName: "Initial Admin",
			userSymbolPrivKey: "issuer-private-key",
			userRole: UserRole.admin,
		});
	});

	test("必要な env がない場合はエラーにする", async () => {
		userCountMock.mockResolvedValueOnce(0);
		const { ensureInitialUserExists } = await import("../../initialUser");

		await expect(ensureInitialUserExists()).rejects.toThrow(
			"INITIAL_ADMIN_EMAIL is required to create the initial admin user.",
		);
	});

	test("registerFamily の P2002 は握りつぶす", async () => {
		userCountMock.mockResolvedValueOnce(0);
		hashPasswordMock.mockReturnValueOnce("hashed-password");
		process.env.INITIAL_ADMIN_EMAIL = "admin@example.com";
		process.env.INITIAL_ADMIN_PASSWORD = "admin";
		process.env.INITIAL_ADMIN_SYMBOL_PRIVATE_KEY = "issuer-private-key";
		registerFamilyMock.mockRejectedValueOnce({ code: "P2002" });
		const { ensureInitialUserExists } = await import("../../initialUser");

		await expect(ensureInitialUserExists()).resolves.toBeUndefined();
	});
});
