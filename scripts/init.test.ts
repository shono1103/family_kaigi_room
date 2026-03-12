import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const loadEnvConfigMock = vi.fn();
const disconnectMock = vi.fn();
const ensureInitialUserExistsMock = vi.fn();

vi.mock("@next/env", () => ({
	loadEnvConfig: loadEnvConfigMock,
}));

vi.mock("../src/lib/prisma", () => ({
	prisma: {
		$disconnect: disconnectMock,
	},
}));

vi.mock("./lib/initialUser", () => ({
	ensureInitialUserExists: ensureInitialUserExistsMock,
}));

describe("scripts/init", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.exitCode = undefined;
	});

	afterEach(() => {
		process.exitCode = undefined;
	});

	test("runInit: env を読み込み初期ユーザー作成を実行する", async () => {
		const { runInit } = await import("./init");

		await runInit();

		expect(loadEnvConfigMock).toHaveBeenCalledWith(process.cwd());
		expect(ensureInitialUserExistsMock).toHaveBeenCalledTimes(1);
		expect(disconnectMock).toHaveBeenCalledTimes(1);
		expect(process.exitCode).toBeUndefined();
	});

	test("runInit: 初期化失敗時に exitCode を設定して disconnect する", async () => {
		const error = new Error("boom");
		ensureInitialUserExistsMock.mockRejectedValueOnce(error);
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { runInit } = await import("./init");

		await runInit();

		expect(process.exitCode).toBe(1);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Startup initialization failed.",
		);
		expect(consoleErrorSpy).toHaveBeenCalledWith(error);
		expect(disconnectMock).toHaveBeenCalledTimes(1);

		consoleErrorSpy.mockRestore();
	});
});
