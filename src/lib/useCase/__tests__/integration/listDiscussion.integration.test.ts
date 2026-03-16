import { FamilyRole, UserRole } from "@prisma/client";
import { createDiscussion } from "@/lib/db/discussion/create";
import { createFamily } from "@/lib/db/family/create";
import { createUser } from "@/lib/db/user/create";
import { createUserInfo } from "@/lib/db/userInfo/create";
import {
	cleanupFamiliesByIds,
	createIntegrationFamilyInput,
} from "@/lib/testing/integration/db/family";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/db/timeout";
import { listDiscussion } from "@/lib/useCase/discussion/listDiscussion";

describe("listDiscussion use case integration", () => {
	const createdFamilyIds: string[] = [];

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("userId に紐づく discussion 一覧を投稿者情報付きで取得できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);

		const author = await createUser({
			email: `list-discussion-author-${Date.now()}@example.com`,
			passwordHash: "discussion-author-password-hash",
			familyId: family.id,
			isFamilyOwner: true,
			isFirst: false,
			role: UserRole.normal,
		});
		await createUserInfo({
			userId: author.id,
			name: "Discussion Author",
			familyRole: FamilyRole.father,
		});

		await createDiscussion({
			userId: author.id,
			familyId: family.id,
			title: "First discussion",
			detail: "First detail",
			authorUserId: author.id,
		});
		await createDiscussion({
			userId: author.id,
			familyId: family.id,
			title: "Second discussion",
			detail: "Second detail",
			authorUserId: author.id,
		});

		const discussions = await listDiscussion(author.id);

		expect(discussions.length).toBeGreaterThanOrEqual(2);
		expect(discussions[0]?.createdAt instanceof Date).toBe(true);
		expect(discussions.some((discussion) => discussion.title === "First discussion")).toBe(true);
		expect(discussions.some((discussion) => discussion.title === "Second discussion")).toBe(true);

		const targetDiscussion = discussions.find(
			(discussion) => discussion.title === "First discussion",
		);
		expect(targetDiscussion?.authorUser?.id).toBe(author.id);
		expect(targetDiscussion?.authorUser?.name).toBe("Discussion Author");
		expect(targetDiscussion?.authorUser?.familyRole).toBe(FamilyRole.father);
	}, DB_INTEGRATION_TIMEOUT_MS);
});
