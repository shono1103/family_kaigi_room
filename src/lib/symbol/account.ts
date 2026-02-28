const PUBLIC_KEY_REGEX = /^[0-9A-F]{64}$/;
const SYMBOL_ACCOUNT_REQUEST_TIMEOUT_MS = 3000;

export type SymbolAccountExistence = "exists" | "not_found" | "unreachable";

export function normalizeSymbolPublicKey(value: string | null | undefined) {
	return (value ?? "").trim().toUpperCase() || null;
}

export function isValidSymbolPublicKey(publicKey: string) {
	return PUBLIC_KEY_REGEX.test(publicKey);
}

function getSymbolNodeUrlList() {
	const network = process.env.SYMBOL_NETWORK;
	const list =
		network === "mainnet"
			? process.env.SYMBOL_MAINNET_NODE_URL_LIST
			: process.env.SYMBOL_TESTNET_NODE_URL_LIST;

	return (list ?? "")
		.split(",")
		.map((url) => url.trim())
		.filter(Boolean);
}

export async function checkSymbolAccountExistenceByPublicKey(
	publicKey: string,
): Promise<SymbolAccountExistence> {
	const nodeUrlList = getSymbolNodeUrlList();

	for (const nodeUrl of nodeUrlList) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
		}, SYMBOL_ACCOUNT_REQUEST_TIMEOUT_MS);

		try {
			const response = await fetch(
				`${nodeUrl.replace(/\/$/, "")}/accounts/${publicKey}`,
				{
					method: "GET",
					cache: "no-store",
					signal: controller.signal,
				},
			);

			if (response.status === 200) {
				return "exists";
			}

			if (response.status === 404) {
				return "not_found";
			}
		} catch {
			// try next node
		} finally {
			clearTimeout(timeoutId);
		}
	}

	return "unreachable";
}
