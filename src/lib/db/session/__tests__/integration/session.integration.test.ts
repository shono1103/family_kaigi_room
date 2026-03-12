import { createFamily } from "@/lib/db/family/create";
import { createSessionRecord } from "@/lib/db/session/create";
import { deleteSession } from "@/lib/db/session/delete";
import { readSessionById, readSessionByTokenHash } from "@/lib/db/session/read";
import { updateSession } from "@/lib/db/session/update";
import { createUser } from "@/lib/db/user/create";
import { ensureDbIntegrationEnv } from "@/lib/testing/integration/db/env";
import {
	cleanupFamiliesByIds,
	createIntegrationFamilyInput,
} from "@/lib/testing/integration/db/family";
import {
	cleanupSessionsByIds,
	createIntegrationSessionInput,
} from "@/lib/testing/integration/db/session";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/testing/integration/db/timeout";
import { createIntegrationUserInput } from "@/lib/testing/integration/db/user";

describe("db session CRUD integration", () => {
	const createdFamilyIds: string[] = [];
	const createdSessionIds: string[] = [];
	let sessionId: string | null = null;
	let tokenHash: string | null = null;

	const requireSessionId = () => {
		expect(sessionId).not.toBeNull();
		if (!sessionId) {
			throw new Error("sessionId is null. create test must run first.");
		}
		return sessionId;
	};

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupSessionsByIds(createdSessionIds);
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("create: session レコードを作成できる", async () => {
		const family = await createFamily(createIntegrationFamilyInput());
		createdFamilyIds.push(family.id);
		const user = await createUser(createIntegrationUserInput(family.id));

		const input = createIntegrationSessionInput(user.id);
		const created = await createSessionRecord(input);

		createdSessionIds.push(created.id);
		sessionId = created.id;
		tokenHash = created.tokenHash;

		expect(created.userId).toBe(user.id);
		expect(created.tokenHash).toBe(input.tokenHash);
		expect(created.expiresAt).toBeInstanceOf(Date);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("read: id と tokenHash で session を取得できる", async () => {
		const resolvedSessionId = requireSessionId();
		expect(tokenHash).not.toBeNull();
		if (!tokenHash) {
			throw new Error("tokenHash is null. create test must run first.");
		}

		const byId = await readSessionById(resolvedSessionId);
		const byTokenHash = await readSessionByTokenHash(tokenHash);

		expect(byId?.id).toBe(resolvedSessionId);
		expect(byTokenHash?.id).toBe(resolvedSessionId);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("update: session の値を更新できる", async () => {
		const resolvedSessionId = requireSessionId();
		const nextTokenHash = `updated-token-hash-${Date.now()}`;
		const revokedAt = new Date();
		const updated = await updateSession(resolvedSessionId, {
			tokenHash: nextTokenHash,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
			revokedAt,
		});

		tokenHash = updated.tokenHash;

		expect(updated.id).toBe(resolvedSessionId);
		expect(updated.tokenHash).toBe(nextTokenHash);
		expect(updated.revokedAt?.getTime()).toBe(revokedAt.getTime());
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("delete: session を削除できる", async () => {
		const resolvedSessionId = requireSessionId();
		const deleted = await deleteSession(resolvedSessionId);

		expect(deleted.id).toBe(resolvedSessionId);
		expect(await readSessionById(resolvedSessionId)).toBeNull();

		sessionId = null;
	}, DB_INTEGRATION_TIMEOUT_MS);
});
