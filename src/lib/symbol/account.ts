import {
	fetchWithTimeout,
	getSymbolNodeUrlList,
	isValidSymbolPublicKey,
	normalizeSymbolPublicKey,
} from "./utils";

const SYMBOL_ACCOUNT_REQUEST_TIMEOUT_MS = 3000;

export type SymbolAccountExistence = "exists" | "not_found" | "unreachable";

export function parseSymbolPublicKey(
	value: string | null | undefined,
): string | null {
	return normalizeSymbolPublicKey(value);
}

export function validateSymbolPublicKey(publicKey: string) {
	return isValidSymbolPublicKey(publicKey);
}

export async function checkSymbolAccountExistenceByPublicKey(
	publicKey: string,
): Promise<SymbolAccountExistence> {
	const nodeUrlList = getSymbolNodeUrlList();

	for (const nodeUrl of nodeUrlList) {
		try {
			const response = await fetchWithTimeout(
				`${nodeUrl.replace(/\/$/, "")}/accounts/${publicKey}`,
				SYMBOL_ACCOUNT_REQUEST_TIMEOUT_MS,
			);

			if (response.status === 200) {
				return "exists";
			}

			if (response.status === 404) {
				return "not_found";
			}
		} catch {
			// try next node
		}
	}

	return "unreachable";
}
