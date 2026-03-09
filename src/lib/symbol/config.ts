import { SymbolFacade } from "symbol-sdk/symbol";

// --- Environment Bootstrap ---
// Load default env for non-Next runtime paths (CLI/tests).
process.loadEnvFile?.(".env");

// --- Env Parsing Helpers ---
const parsePositiveIntEnv = (
	rawValue: string | undefined,
	fallback: number,
): number => {
	const parsed = Number.parseInt(rawValue ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// --- Network & Facade ---
const resolveSymbolNetworkName = (): "mainnet" | "testnet" =>
	process.env.SYMBOL_NETWORK === "mainnet" ? "mainnet" : "testnet";

const symbolNetworkName = resolveSymbolNetworkName();
export const facade: SymbolFacade = new SymbolFacade(symbolNetworkName);

// --- Node URL Resolution ---
export const getDummyMainnetNodeUrl = (): string =>
	"https://mainnet-node.invalid:3001";

export const getDummyTestnetNodeUrl = (): string =>
	"https://testnet-node.invalid:3001";

const isValidNodeUrl = (value: string): boolean => {
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
};

export const extractValidNodeUrl = (rawNodeUrlList: string | undefined): string[] =>
	(rawNodeUrlList ?? "")
		.split(",")
		.map((url) => url.trim())
		.filter((url) => Boolean(url) && isValidNodeUrl(url));

const createNodeUrlList = (): string[] => {
	const rawNodeUrlList =
		symbolNetworkName === "mainnet"
			? process.env.SYMBOL_MAINNET_NODE_URL_LIST
			: process.env.SYMBOL_TESTNET_NODE_URL_LIST;

	return extractValidNodeUrl(rawNodeUrlList);
};

const nodeUrlList: string[] = createNodeUrlList();
export const nodeUrl: string =
	nodeUrlList[0] ??
	(symbolNetworkName === "mainnet"
		? getDummyMainnetNodeUrl()
		: getDummyTestnetNodeUrl());

// --- Transaction Defaults ---
export const aggregateType =
	process.env.AGGREGATE_TYPE ?? "aggregate_complete_transaction_v3";
export const feeMultiplier = parsePositiveIntEnv(process.env.FEE_MULTIPLIER, 100);
export const deadlineHours = parsePositiveIntEnv(process.env.DEADLINE_HOURS, 2);

// --- HTTP / Poll Timing Defaults ---
export const symbolHttpTimeoutMs = parsePositiveIntEnv(
	process.env.SYMBOL_HTTP_TIMEOUT_MS,
	5000,
);
export const symbolPollIntervalMs = parsePositiveIntEnv(
	process.env.SYMBOL_POLL_INTERVAL_MS,
	3000,
);
export const symbolPollTimeoutMs = parsePositiveIntEnv(
	process.env.SYMBOL_POLL_TIMEOUT_MS,
	120000,
);
