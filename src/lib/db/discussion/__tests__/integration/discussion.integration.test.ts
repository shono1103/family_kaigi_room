import { FamilyRole, UserRole } from "@prisma/client";
import { createDiscussion } from "@/lib/db/discussion/create";
import { deleteDiscussion } from "@/lib/db/discussion/delete";
import {
	readDiscussionById,
	readDiscussionsByAuthorUserId,
	readDiscussionsByUserId,
} from "@/lib/db/discussion/read";
import { updateDiscussion } from "@/lib/db/discussion/update";
import { createFamily } from "@/lib/db/family/create";
import { createUser } from "@/lib/db/user/create";
import { createUserInfo } from "@/lib/db/userInfo/create";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import {
	cleanupFamiliesByIds,
	createIntegrationFamilyInput,
} from "@/lib/testing/integration/db/family";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/db/timeout";

describe("db discussion CRUD integration", () => {
	const createdFamilyIds: string[] = [];
	let discussionId: string | null = null;
	let authorUserId: string | null = null;

	const requireDiscussionId = () => {
		expect(discussionId).not.toBeNull();
		if (!discussionId) {
			throw new Error("discussionId is null. create test must run first.");
		}
		return discussionId;
	};

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("create: discussion レコードを作成できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);

		const author = await createUser({
			email: `discussion-author-${Date.now()}@example.com`,
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

		const created = await createDiscussion({
			userId: author.id,
			familyId: family.id,
			title: "Weekend plan",
			detail: "Let's discuss this weekend's schedule.",
			authorUserId: author.id,
		});

		discussionId = created.id;
		authorUserId = author.id;

		expect(created.userId).toBe(author.id);
		expect(created.familyId).toBe(family.id);
		expect(created.authorUserId).toBe(author.id);
		expect(created.title).toBe("Weekend plan");
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("read: id / userId / authorUserId で discussion を取得できる", async () => {
		const resolvedDiscussionId = requireDiscussionId();
		expect(authorUserId).not.toBeNull();
		if (!authorUserId) {
			throw new Error("authorUserId is null. create test must run first.");
		}

		const byId = await readDiscussionById(resolvedDiscussionId);
		const byUserId = await readDiscussionsByUserId(authorUserId);
		const byAuthorUserId = await readDiscussionsByAuthorUserId(authorUserId);

		expect(byId?.id).toBe(resolvedDiscussionId);
		expect(byUserId.some((discussion) => discussion.id === resolvedDiscussionId)).toBe(true);
		expect(byAuthorUserId.some((discussion) => discussion.id === resolvedDiscussionId)).toBe(true);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("update: discussion の値を更新できる", async () => {
		const resolvedDiscussionId = requireDiscussionId();

		const updated = await updateDiscussion(resolvedDiscussionId, {
			title: "Updated weekend plan",
			detail: "Let's finalize this weekend's schedule.",
		});

		expect(updated.id).toBe(resolvedDiscussionId);
		expect(updated.title).toBe("Updated weekend plan");
		expect(updated.detail).toBe("Let's finalize this weekend's schedule.");
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("delete: discussion を削除できる", async () => {
		const resolvedDiscussionId = requireDiscussionId();
		const deleted = await deleteDiscussion(resolvedDiscussionId);

		expect(deleted.id).toBe(resolvedDiscussionId);
		expect(await readDiscussionById(resolvedDiscussionId)).toBeNull();

		discussionId = null;
	}, DB_INTEGRATION_TIMEOUT_MS);
});
