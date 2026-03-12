import { FamilyRole } from "@prisma/client";
import { createFamily } from "@/lib/db/family/create";
import { createUserInfo } from "@/lib/db/userInfo/create";
import { deleteUserInfo } from "@/lib/db/userInfo/delete";
import { readUserInfoBySymbolPubKey, readUserInfoByUserId } from "@/lib/db/userInfo/read";
import { updateUserInfo } from "@/lib/db/userInfo/update";
import { createUser } from "@/lib/db/user/create";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import {
	cleanupFamiliesByIds,
	createIntegrationFamilyInput,
} from "@/lib/testing/integration/db/family";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/db/timeout";
import { createIntegrationUserInfoInput } from "@/lib/testing/integration/db/userInfo";
import { createIntegrationUserInput } from "@/lib/testing/integration/db/user";

describe("db userInfo CRUD integration", () => {
	const createdFamilyIds: string[] = [];
	let userId: string | null = null;
	let symbolPubKey: string | null = null;

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

	test("create: userInfo レコードを作成できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);
		const user = await createUser(createIntegrationUserInput(family.id));
		userId = user.id;

		const input = createIntegrationUserInfoInput(user.id);
		const created = await createUserInfo(input);
		symbolPubKey = created.symbolPubKey;

		expect(created.userId).toBe(user.id);
		expect(created.name).toBe(input.name);
		expect(created.familyRole).toBe(FamilyRole.child);
		expect(created.symbolPubKey).toBe(input.symbolPubKey);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("read: userId と symbolPubKey で userInfo を取得できる", async () => {
		const resolvedUserId = requireUserId();
		expect(symbolPubKey).not.toBeNull();
		if (!symbolPubKey) {
			throw new Error("symbolPubKey is null. create test must run first.");
		}

		const byUserId = await readUserInfoByUserId(resolvedUserId);
		const bySymbolPubKey = await readUserInfoBySymbolPubKey(symbolPubKey);

		expect(byUserId?.userId).toBe(resolvedUserId);
		expect(bySymbolPubKey?.userId).toBe(resolvedUserId);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("update: userInfo の値を更新できる", async () => {
		const resolvedUserId = requireUserId();
		const nextSymbolPubKey = `updated-user-info-pub-${Date.now()}`;
		const updated = await updateUserInfo(resolvedUserId, {
			name: `updated-user-info-${Date.now()}`,
			familyRole: FamilyRole.father,
			symbolPubKey: nextSymbolPubKey,
		});

		symbolPubKey = updated.symbolPubKey;

		expect(updated.userId).toBe(resolvedUserId);
		expect(updated.familyRole).toBe(FamilyRole.father);
		expect(updated.symbolPubKey).toBe(nextSymbolPubKey);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("delete: userInfo を削除できる", async () => {
		const resolvedUserId = requireUserId();
		const deleted = await deleteUserInfo(resolvedUserId);

		expect(deleted.userId).toBe(resolvedUserId);
		expect(await readUserInfoByUserId(resolvedUserId)).toBeNull();

		userId = null;
	}, DB_INTEGRATION_TIMEOUT_MS);
});
