import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: [
			"src/lib/symbol/**/__tests__/integration/**/*.integration.test.ts",
			"src/lib/useCase/family/**/__tests__/integration/**/*.integration.test.ts",
		],
		environment: "node",
		globals: true,
		fileParallelism: false,
		maxWorkers: 1,
		minWorkers: 1,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
});
