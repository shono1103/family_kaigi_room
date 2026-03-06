import { nodeUrl } from "../config";
import {
	fetchWithTimeout,
	isValidSymbolPublicKey,
	normalizeSymbolPublicKey,
} from "../utils";

const SYMBOL_ACCOUNT_REQUEST_TIMEOUT_MS = 3000;

export type SymbolAccountExistence = "exists" | "not_found";

export type ReadSymbolAccountResult =
	| {
			ok: true;
			status: "ok";
			publicKey: string;
			existence: SymbolAccountExistence;
	  }
	| {
			ok: false;
			status: "invalid_public_key" | "node_unreachable" | "read_failed";
			message: string;
	  };

export function parseSymbolPublicKey(
	value: string | null | undefined,
): string | null {
	return normalizeSymbolPublicKey(value);
}

export function validateSymbolPublicKey(publicKey: string): boolean {
	return isValidSymbolPublicKey(publicKey);
}

export async function checkSymbolAccountExistenceByPublicKey(
	publicKey: string,
): Promise<SymbolAccountExistence | "unreachable"> {
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
		return "unreachable";
	} catch {
		return "unreachable";
	}
}

export const readSymbolAccountByPublicKey = async (
	rawPublicKey: string | null | undefined,
): Promise<ReadSymbolAccountResult> => {
	try {
		const publicKey = parseSymbolPublicKey(rawPublicKey);
		if (!publicKey || !validateSymbolPublicKey(publicKey)) {
			return {
				ok: false,
				status: "invalid_public_key",
				message: "publicKey must be a 64-character hex string.",
			};
		}

		const existence = await checkSymbolAccountExistenceByPublicKey(publicKey);
		if ("unreachable" === existence) {
			return {
				ok: false,
				status: "node_unreachable",
				message: "Symbol node is unreachable.",
			};
		}

		return {
			ok: true,
			status: "ok",
			publicKey,
			existence,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			status: "read_failed",
			message,
		};
	}
};
