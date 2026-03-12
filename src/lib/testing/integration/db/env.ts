function resolveIntegrationDatabaseUrl() {
	const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
	if (testDatabaseUrl) {
		process.env.DATABASE_URL = testDatabaseUrl;
		return testDatabaseUrl;
	}

	return process.env.DATABASE_URL?.trim();
}

export function requireDatabaseUrl() {
	const databaseUrl = resolveIntegrationDatabaseUrl();

	if (!databaseUrl) {
		throw new Error(
			"DATABASE_URL or TEST_DATABASE_URL is required for db integration tests.",
		);
	}

	return databaseUrl;
}

export function ensureDbIntegrationEnv() {
	requireDatabaseUrl();
}
