export const loadIntegrationEnv = () => {
	if (process.loadEnvFile) {
		process.loadEnvFile(".env");
		process.loadEnvFile(".env.test");
	}
};
