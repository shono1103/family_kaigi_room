import { FamilyRole, UserRole } from "@prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { createFamily } from "@/lib/db/family/create";
import { createUser } from "@/lib/db/user/create";
import { readUserByEmail } from "@/lib/db/user/read";
import { readUserInfoByUserId } from "@/lib/db/userInfo/read";
import { cleanupFamiliesByIds, createIntegrationFamilyInput } from "@/lib/testing/integration/db/family";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/db/timeout";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import { createFamilyUser } from "@/lib/useCase/createFamilyUser";

describe("createFamilyUser use case integration", () => {
	const createdFamilyIds: string[] = [];

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("family owner は同じ family に user と userInfo を作成できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);

		const owner = await createUser({
			email: `add-user-owner-${Date.now()}@example.com`,
			passwordHash: "owner-password-hash",
			familyId: family.id,
			isFamilyOwner: true,
			isFirst: false,
			role: UserRole.normal,
		});

		const newUserEmail = `add-user-child-${Date.now()}@example.com`;
		const result = await createFamilyUser({
			requesterUserId: owner.id,
			email: newUserEmail,
			name: "Added Child",
			familyRole: FamilyRole.child,
		});

		const persistedUser = await readUserByEmail(newUserEmail);
		expect(persistedUser).not.toBeNull();
		expect(persistedUser?.familyId).toBe(family.id);
		expect(persistedUser?.isFamilyOwner).toBe(false);
		expect(persistedUser?.isFirst).toBe(true);
		expect(persistedUser?.role).toBe(UserRole.normal);
		expect(verifyPassword(newUserEmail, persistedUser?.passwordHash ?? "")).toBe(true);

		const persistedUserInfo = await readUserInfoByUserId(result.user.id);
		expect(persistedUserInfo?.name).toBe("Added Child");
		expect(persistedUserInfo?.familyRole).toBe(FamilyRole.child);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("owner でない user は family user を作成できない", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);

		const normalUser = await createUser({
			email: `add-user-normal-${Date.now()}@example.com`,
			passwordHash: "normal-password-hash",
			familyId: family.id,
			isFamilyOwner: false,
			isFirst: false,
			role: UserRole.normal,
		});

		await expect(
			createFamilyUser({
				requesterUserId: normalUser.id,
				email: `blocked-child-${Date.now()}@example.com`,
				name: "Blocked Child",
				familyRole: FamilyRole.child,
			}),
		).rejects.toThrow("only family owner can create family user");
	}, DB_INTEGRATION_TIMEOUT_MS);
});
