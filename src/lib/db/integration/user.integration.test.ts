import { UserRole } from "@prisma/client";
import { createFamily } from "@/lib/db/family/create";
import { createUser } from "@/lib/db/user/create";
import { deleteUser } from "@/lib/db/user/delete";
import { readUserByEmail, readUserById } from "@/lib/db/user/read";
import { updateUser } from "@/lib/db/user/update";
import { ensureDbIntegrationEnv } from "@/lib/db/integration/_helpers/env";
import {
	cleanupFamiliesByIds,
	createIntegrationFamilyInput,
} from "@/lib/db/integration/_helpers/family";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/db/integration/_helpers/timeout";
import { createIntegrationUserInput } from "@/lib/db/integration/_helpers/user";

describe("db user CRUD integration", () => {
	const createdFamilyIds: string[] = [];
	let userId: string | null = null;
	let familyId: string | null = null;
	let email: string | null = null;

	const requireUserId = () => {
		expect(userId).not.toBeNull();
		if (!userId) {
			throw new Error("userId is null. create test must run first.");
		}
		return userId;
	};

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("create: user レコードを作成できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);
		familyId = family.id;

		const input = createIntegrationUserInput(family.id);
		const created = await createUser(input);

		userId = created.id;
		email = created.email;

		expect(created.familyId).toBe(family.id);
		expect(created.email).toBe(input.email);
		expect(created.passwordHash).toBe(input.passwordHash);
		expect(created.isFamilyOwner).toBe(false);
		expect(created.role).toBe(UserRole.normal);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("read: id と email で user を取得できる", async () => {
		const resolvedUserId = requireUserId();
		expect(email).not.toBeNull();
		if (!email) {
			throw new Error("email is null. create test must run first.");
		}

		const byId = await readUserById(resolvedUserId);
		const byEmail = await readUserByEmail(email);

		expect(byId?.id).toBe(resolvedUserId);
		expect(byEmail?.id).toBe(resolvedUserId);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("update: user の値を更新できる", async () => {
		const resolvedUserId = requireUserId();
		const resolvedFamilyId = familyId;
		expect(resolvedFamilyId).not.toBeNull();
		if (!resolvedFamilyId) {
			throw new Error("familyId is null. create test must run first.");
		}

		const nextEmail = `updated-${Date.now()}@example.com`;
		const updated = await updateUser(resolvedUserId, {
			email: nextEmail,
			passwordHash: "updated-password-hash",
			familyId: resolvedFamilyId,
			isFamilyOwner: true,
			role: UserRole.admin,
		});

		email = updated.email;

		expect(updated.id).toBe(resolvedUserId);
		expect(updated.email).toBe(nextEmail);
		expect(updated.passwordHash).toBe("updated-password-hash");
		expect(updated.isFamilyOwner).toBe(true);
		expect(updated.role).toBe(UserRole.admin);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("delete: user を削除できる", async () => {
		const resolvedUserId = requireUserId();
		const deleted = await deleteUser(resolvedUserId);

		expect(deleted.id).toBe(resolvedUserId);
		expect(await readUserById(resolvedUserId)).toBeNull();

		userId = null;
	}, DB_INTEGRATION_TIMEOUT_MS);
});
