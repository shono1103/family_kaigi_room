import { UserRole } from "@prisma/client";
import { createFamily } from "@/lib/db/family/create";
import { readQuestById } from "@/lib/db/quest/read";
import { createUser } from "@/lib/db/user/create";
import { cleanupFamiliesByIds, createIntegrationFamilyInput } from "@/lib/testing/integration/db/family";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/db/timeout";
import { issueQuest } from "@/lib/useCase/quest/issueQuest";

describe("issueQuest use case integration", () => {
	const createdFamilyIds: string[] = [];

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("quest を作成し、issuer / target / isResolved を保存できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);

		const issuer = await createUser({
			email: `issue-quest-issuer-${Date.now()}@example.com`,
			passwordHash: "issuer-password-hash",
			familyId: family.id,
			isFamilyOwner: true,
			isFirst: false,
			role: UserRole.normal,
		});
		const target = await createUser({
			email: `issue-quest-target-${Date.now()}@example.com`,
			passwordHash: "target-password-hash",
			familyId: family.id,
			isFamilyOwner: false,
			isFirst: true,
			role: UserRole.normal,
		});

		const result = await issueQuest({
			userId: issuer.id,
			targetUserId: target.id,
			title: "Take out the trash",
			detail: "Take out the trash before 8pm.",
		});

		expect(result.quest.userId).toBe(issuer.id);
		expect(result.quest.issuerUserId).toBe(issuer.id);
		expect(result.quest.targetUserId).toBe(target.id);
		expect(result.quest.isResolved).toBe("false");

		const persistedQuest = await readQuestById(result.quest.id);
		expect(persistedQuest?.id).toBe(result.quest.id);
		expect(persistedQuest?.targetUserId).toBe(target.id);
	}, DB_INTEGRATION_TIMEOUT_MS);
});
