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

const createNodeUrlList = (): string[] => {
	const network = resolveSymbolNetworkName();
	const list =
		network === "mainnet"
			? process.env.SYMBOL_MAINNET_NODE_URL_LIST
			: process.env.SYMBOL_TESTNET_NODE_URL_LIST;

	return (list ?? "")
		.split(",")
		.map((url) => url.trim())
		.filter(Boolean);
};

export const nodeUrlList: string[] = createNodeUrlList();
export const nodeUrl: string | null = nodeUrlList[0] ?? null;

export const aggregateType = process.env.AGGREGATE_TYPE ?? 'aggregate_complete_transaction_v3';

export const feeMultiplier = Number.parseInt(process.env.FEE_MULTIPLIER ?? '100', 10);
export const deadlineHours = Number.parseInt(process.env.DEADLINE_HOURS ?? '2', 10);
