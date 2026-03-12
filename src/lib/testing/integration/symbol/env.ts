export const loadIntegrationEnv = () => {
	if (process.loadEnvFile) {
		process.loadEnvFile(".env");
		process.loadEnvFile(".env.test");
	}

	if (process.env.TEST_DATABASE_URL?.trim()) {
		process.env.DATABASE_URL = process.env.TEST_DATABASE_URL.trim();
	}

	const testEnvKeys = [
		"SYMBOL_NETWORK",
		"SYMBOL_TESTNET_NODE_URL_LIST",
		"SYMBOL_MAINNET_NODE_URL_LIST",
		"SYMBOL_ISSUER_PRIVATE_KEY",
		"SYMBOL_TICKET_METADATA_SEED",
		"AGGREGATE_TYPE",
		"FEE_MULTIPLIER",
		"DEADLINE_HOURS",
	] as const;

	for (const key of testEnvKeys) {
		const testValue = process.env[`TEST_${key}`]?.trim();
		if (testValue) {
			process.env[key] = testValue;
		}
	}
};
