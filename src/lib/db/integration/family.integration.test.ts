import { createFamily } from "@/lib/db/family/create";
import { deleteFamily } from "@/lib/db/family/delete";
import { readFamilyByCurrencyMosaicId, readFamilyById } from "@/lib/db/family/read";
import { updateFamily } from "@/lib/db/family/update";
import { ensureDbIntegrationEnv } from "@/lib/db/integration/_helpers/env";
import {
	cleanupFamiliesByIds,
	createIntegrationFamilyInput,
} from "@/lib/db/integration/_helpers/family";
import { DB_INTEGRATION_TIMEOUT_MS } from "@/lib/db/integration/_helpers/timeout";

describe("db family CRUD integration", () => {
	const createdFamilyIds: string[] = [];
	let familyId: string | null = null;
	let currencyMosaicId: string | null = null;

	const requireFamilyId = () => {
		expect(familyId).not.toBeNull();
		if (!familyId) {
			throw new Error("familyId is null. create test must run first.");
		}
		return familyId;
	};

	beforeAll(() => {
		ensureDbIntegrationEnv();
	});

	afterAll(async () => {
		await cleanupFamiliesByIds(createdFamilyIds);
	});

	test("create: family レコードを作成できる", async () => {
		const input = createIntegrationFamilyInput();

		const created = await createFamily(input);

		createdFamilyIds.push(created.id);
		familyId = created.id;
		currencyMosaicId = created.currencyMosaicId;

		expect(created.familyName).toBe(input.familyName);
		expect(created.currencyMosaicId).toBe(input.currencyMosaicId.toUpperCase());
		expect(created.symbolPubKey).toBe(input.symbolPubKey?.toUpperCase());
		expect(created.symbolPrivKey).toBe(input.symbolPrivKey?.toUpperCase());
		expect(created.createdAt).toBeInstanceOf(Date);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("read: id と currencyMosaicId で family を取得できる", async () => {
		const resolvedFamilyId = requireFamilyId();
		expect(currencyMosaicId).not.toBeNull();
		if (!currencyMosaicId) {
			throw new Error("currencyMosaicId is null. create test must run first.");
		}

		const byId = await readFamilyById(resolvedFamilyId);
		const byCurrencyMosaicId = await readFamilyByCurrencyMosaicId(currencyMosaicId);

		expect(byId).not.toBeNull();
		expect(byCurrencyMosaicId).not.toBeNull();
		expect(byId?.id).toBe(resolvedFamilyId);
		expect(byCurrencyMosaicId?.id).toBe(resolvedFamilyId);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("update: family の値を更新できる", async () => {
		const resolvedFamilyId = requireFamilyId();
		const nextSuffix = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
		const updated = await updateFamily(resolvedFamilyId, {
			familyName: `updated-family-${nextSuffix}`,
		});

		expect(updated.id).toBe(resolvedFamilyId);
		expect(updated.familyName).toBe(`updated-family-${nextSuffix}`);
		expect(updated.currencyMosaicId).toBe(currencyMosaicId);
	}, DB_INTEGRATION_TIMEOUT_MS);

	test("delete: family を削除できる", async () => {
		const resolvedFamilyId = requireFamilyId();
		const deleted = await deleteFamily(resolvedFamilyId);

		expect(deleted.id).toBe(resolvedFamilyId);

		const readAfterDelete = await readFamilyById(resolvedFamilyId);
		expect(readAfterDelete).toBeNull();

		familyId = null;
	}, DB_INTEGRATION_TIMEOUT_MS);
});
