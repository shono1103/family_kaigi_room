import { SymbolFacade } from "symbol-sdk/symbol";

// Load default env for non-Next runtime paths (CLI/tests).
process.loadEnvFile?.(".env");

const resolveSymbolNetworkName = (): "mainnet" | "testnet" => {
	return process.env.SYMBOL_NETWORK === "mainnet" ? "mainnet" : "testnet";
};

const createSymbolFacade = (): SymbolFacade => {
	return new SymbolFacade(resolveSymbolNetworkName());
};

export const facade: SymbolFacade = createSymbolFacade();

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
	const network = resolveSymbolNetworkName();
	const rawNodeUrlList =
		network === "mainnet"
			? process.env.SYMBOL_MAINNET_NODE_URL_LIST
			: process.env.SYMBOL_TESTNET_NODE_URL_LIST;

	return extractValidNodeUrl(rawNodeUrlList);
};

const nodeUrlList: string[] = createNodeUrlList();
export const nodeUrl: string =
	nodeUrlList[0] ??
	(resolveSymbolNetworkName() === "mainnet"
		? getDummyMainnetNodeUrl()
		: getDummyTestnetNodeUrl());

export const aggregateType = process.env.AGGREGATE_TYPE ?? 'aggregate_complete_transaction_v3';

export const feeMultiplier = Number.parseInt(process.env.FEE_MULTIPLIER ?? '100', 10);
export const deadlineHours = Number.parseInt(process.env.DEADLINE_HOURS ?? '2', 10);
