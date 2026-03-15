import { FamilyRole, UserRole } from "@prisma/client";
import { createFamily } from "@/lib/db/family/create";
import { createQuest } from "@/lib/db/quest/create";
import { deleteQuest } from "@/lib/db/quest/delete";
import { readQuestById, readQuestsByIsResolved, readQuestsByUserId } from "@/lib/db/quest/read";
import { updateQuest } from "@/lib/db/quest/update";
import { createUser } from "@/lib/db/user/create";
import { createUserInfo } from "@/lib/db/userInfo/create";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import { createIntegrationFamilyInput, cleanupFamiliesByIds } from "@/lib/testing/integration/db/family";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/db/timeout";

describe("db quest CRUD integration", () => {
	const createdFamilyIds: string[] = [];
	let questId: string | null = null;
	let issuerUserId: string | null = null;

	const requireQuestId = () => {
		expect(questId).not.toBeNull();
		if (!questId) {
			throw new Error("questId is null. create test must run first.");
		}
		return questId;
	};

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("create: quest レコードを作成できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);

		const issuer = await createUser({
			email: `quest-issuer-${Date.now()}@example.com`,
			passwordHash: "issuer-password-hash",
			familyId: family.id,
			isFamilyOwner: true,
			isFirst: false,
			role: UserRole.normal,
		});
		await createUserInfo({
			userId: issuer.id,
			name: "Quest Issuer",
			familyRole: FamilyRole.father,
		});

		const target = await createUser({
			email: `quest-target-${Date.now()}@example.com`,
			passwordHash: "target-password-hash",
			familyId: family.id,
			isFamilyOwner: false,
			isFirst: true,
			role: UserRole.normal,
		});
		await createUserInfo({
			userId: target.id,
			name: "Quest Target",
			familyRole: FamilyRole.child,
		});

		const created = await createQuest({
			userId: issuer.id,
			title: "Clean the room",
			detail: "Clean your room for 30 minutes.",
			issuerUserId: issuer.id,
			targetUserId: target.id,
			isResolved: "false",
		});

		questId = created.id;
		issuerUserId = issuer.id;

		expect(created.userId).toBe(issuer.id);
		expect(created.issuerUserId).toBe(issuer.id);
		expect(created.targetUserId).toBe(target.id);
		expect(created.isResolved).toBe("false");
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("read: id / userId / isResolved で quest を取得できる", async () => {
		const resolvedQuestId = requireQuestId();
		expect(issuerUserId).not.toBeNull();
		if (!issuerUserId) {
			throw new Error("issuerUserId is null. create test must run first.");
		}

		const byId = await readQuestById(resolvedQuestId);
		const byUserId = await readQuestsByUserId(issuerUserId);
		const byIsResolved = await readQuestsByIsResolved("false");

		expect(byId?.id).toBe(resolvedQuestId);
		expect(byUserId.some((quest) => quest.id === resolvedQuestId)).toBe(true);
		expect(byIsResolved.some((quest) => quest.id === resolvedQuestId)).toBe(true);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("update: quest の値を更新できる", async () => {
		const resolvedQuestId = requireQuestId();

		const updated = await updateQuest(resolvedQuestId, {
			title: "Clean the kitchen",
			detail: "Clean the kitchen after dinner.",
			isResolved: "true",
		});

		expect(updated.id).toBe(resolvedQuestId);
		expect(updated.title).toBe("Clean the kitchen");
		expect(updated.detail).toBe("Clean the kitchen after dinner.");
		expect(updated.isResolved).toBe("true");
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("delete: quest を削除できる", async () => {
		const resolvedQuestId = requireQuestId();
		const deleted = await deleteQuest(resolvedQuestId);

		expect(deleted.id).toBe(resolvedQuestId);
		expect(await readQuestById(resolvedQuestId)).toBeNull();

		questId = null;
	}, DB_INTEGRATION_TIMEOUT_MS);
});
