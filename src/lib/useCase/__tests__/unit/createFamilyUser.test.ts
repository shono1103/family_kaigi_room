import { beforeEach, describe, expect, test, vi } from "vitest";

const readUserByIdMock = vi.fn();
const readUserByEmailMock = vi.fn();
const hashPasswordMock = vi.fn();
const createUserMock = vi.fn();
const createUserInfoMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db/user/read", () => ({
	readUserById: readUserByIdMock,
	readUserByEmail: readUserByEmailMock,
}));

vi.mock("@/lib/auth/password", () => ({
	hashPassword: hashPasswordMock,
}));

vi.mock("@/lib/db/user/create", () => ({
	createUser: createUserMock,
}));

vi.mock("@/lib/db/userInfo/create", () => ({
	createUserInfo: createUserInfoMock,
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		$transaction: transactionMock,
	},
}));

describe("createFamilyUser use case", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		transactionMock.mockImplementation(async (callback) => callback("tx-mock"));
		hashPasswordMock.mockReturnValue("hashed-password");
	});

	test("family owner が自分の family に user と userInfo を作成できる", async () => {
		readUserByIdMock.mockResolvedValueOnce({
			id: "owner-id",
			familyId: "family-id",
			isFamilyOwner: true,
		});
		readUserByEmailMock.mockResolvedValueOnce(null);
		createUserMock.mockResolvedValueOnce({
			id: "created-user-id",
			email: "child@example.com",
			familyId: "family-id",
		});
		createUserInfoMock.mockResolvedValueOnce({
			userId: "created-user-id",
			name: "Child User",
			familyRole: "child",
		});

		const { createFamilyUser } = await import("../../family/createFamilyUser");
		const result = await createFamilyUser({
			requesterUserId: "owner-id",
			email: "Child@example.com",
			name: "Child User",
			familyRole: "child",
		});

		expect(hashPasswordMock).toHaveBeenCalledWith("child@example.com");
		expect(createUserMock).toHaveBeenCalledWith(
			{
				email: "child@example.com",
				passwordHash: "hashed-password",
				familyId: "family-id",
				isFamilyOwner: false,
				isFirst: true,
				role: "normal",
			},
			"tx-mock",
		);
		expect(createUserInfoMock).toHaveBeenCalledWith(
			{
				userId: "created-user-id",
				name: "Child User",
				familyRole: "child",
			},
			"tx-mock",
		);
		expect(result.initialPassword).toBe("child@example.com");
		expect(result.user.id).toBe("created-user-id");
	});

	test("owner でない user は作成できない", async () => {
		readUserByIdMock.mockResolvedValueOnce({
			id: "normal-id",
			familyId: "family-id",
			isFamilyOwner: false,
		});

		const { createFamilyUser } = await import("../../family/createFamilyUser");

		await expect(
			createFamilyUser({
				requesterUserId: "normal-id",
				email: "child@example.com",
				name: "Child User",
				familyRole: "child",
			}),
		).rejects.toThrow("only family owner can create family user");
		expect(createUserMock).not.toHaveBeenCalled();
		expect(createUserInfoMock).not.toHaveBeenCalled();
	});

	test("email 重複時は作成しない", async () => {
		readUserByIdMock.mockResolvedValueOnce({
			id: "owner-id",
			familyId: "family-id",
			isFamilyOwner: true,
		});
		readUserByEmailMock.mockResolvedValueOnce({
			id: "existing-user-id",
			email: "child@example.com",
		});

		const { createFamilyUser } = await import("../../family/createFamilyUser");

		await expect(
			createFamilyUser({
				requesterUserId: "owner-id",
				email: "child@example.com",
				name: "Child User",
				familyRole: "child",
			}),
		).rejects.toThrow("email is already in use");
		expect(createUserMock).not.toHaveBeenCalled();
		expect(createUserInfoMock).not.toHaveBeenCalled();
	});
});
