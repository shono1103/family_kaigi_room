import { UserRole } from "@prisma/client";
import { readDiscussionById } from "@/lib/db/discussion/read";
import { createFamily } from "@/lib/db/family/create";
import { createUser } from "@/lib/db/user/create";
import {
	cleanupFamiliesByIds,
	createIntegrationFamilyInput,
} from "@/lib/testing/integration/db/family";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/db/timeout";
import { createDiscussion } from "@/lib/useCase/discussion/createDiscussion";

describe("createDiscussion use case integration", () => {
	const createdFamilyIds: string[] = [];

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("discussion を作成し、authorUserId を userId として保存できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);

		const author = await createUser({
			email: `create-discussion-author-${Date.now()}@example.com`,
			passwordHash: "discussion-author-password-hash",
			familyId: family.id,
			isFamilyOwner: true,
			isFirst: false,
			role: UserRole.normal,
		});

		const result = await createDiscussion({
			userId: author.id,
			title: "Family meeting topic",
			detail: "Let's discuss the family meeting agenda for next week.",
		});

		expect(result.discussion.userId).toBe(author.id);
		expect(result.discussion.familyId).toBe(family.id);
		expect(result.discussion.authorUserId).toBe(author.id);
		expect(result.discussion.title).toBe("Family meeting topic");

		const persistedDiscussion = await readDiscussionById(result.discussion.id);
		expect(persistedDiscussion?.id).toBe(result.discussion.id);
		expect(persistedDiscussion?.familyId).toBe(family.id);
		expect(persistedDiscussion?.authorUserId).toBe(author.id);
	}, DB_INTEGRATION_TIMEOUT_MS);
});
