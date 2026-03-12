import { pathToFileURL } from "node:url";
import { loadEnvConfig } from "@next/env";
import { prisma } from "../src/lib/prisma";
import { ensureInitialUserExists } from "./lib/initialUser";

export async function runInit() {
	try {
		loadEnvConfig(process.cwd());
		await ensureInitialUserExists();
	} catch (error) {
		console.error("Startup initialization failed.");
		console.error(error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

const isDirectExecution =
	process.argv[1] !== undefined &&
	import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
	void runInit();
}
