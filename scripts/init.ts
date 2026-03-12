import { loadEnvConfig } from "@next/env";
import { prisma } from "../src/lib/prisma";
import { ensureInitialUserExists } from "./lib/initialUser";

async function main() {
	loadEnvConfig(process.cwd());
	await ensureInitialUserExists();
}

main()
	.catch((error) => {
		console.error("Startup initialization failed.");
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
