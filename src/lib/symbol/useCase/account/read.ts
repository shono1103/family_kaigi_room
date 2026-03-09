import { nodeUrl } from "../../config";
import {
	fetchWithTimeout,
} from "../../utils/node-client";

import {
	isValidSymbolPublicKey,
	normalizeSymbolPublicKey,
} from "../../utils/normalizers"

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

type SymbolAccountMosaicDto = Readonly<{
	id?: string;
	amount?: string;
}>;

type SymbolAccountResponseDto = Readonly<{
	account?: {
		mosaics?: SymbolAccountMosaicDto[];
	};
}>;

export type AccountOwnedMosaic = Readonly<{
	mosaicIdHex: string;
	amountRaw: string;
}>;

export type ReadAccountOwnedMosaicsResult =
	| {
		ok: true;
		status: "ok";
		publicKey: string;
		mosaics: AccountOwnedMosaic[];
	}
	| {
		ok: false;
		status:
		| "missing_public_key"
		| "invalid_public_key"
		| "account_not_found"
		| "node_unreachable"
		| "read_failed";
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
			`${nodeUrl.replace(/\/$/, "")}/accounts/${publicKey}`
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

const normalizeMosaicId = (value: string | undefined): string | null => {
	if (!value) {
		return null;
	}
	const normalized = value.trim().replace(/^0x/i, "").toUpperCase();
	return /^[0-9A-F]{16}$/.test(normalized) ? normalized : null;
};

const normalizeAmountRaw = (value: string | undefined): string | null => {
	if (!value || !/^\d+$/.test(value)) {
		return null;
	}
	return value;
};

export const readAccountOwnedMosaicsByPublicKey = async (
	inputPublicKey: string | null | undefined,
): Promise<ReadAccountOwnedMosaicsResult> => {
	try {
		if (!inputPublicKey || !inputPublicKey.trim()) {
			return {
				ok: false,
				status: "missing_public_key",
				message: "publicKey is required.",
			};
		}

		const normalizedPublicKey = normalizeSymbolPublicKey(inputPublicKey);
		if (!normalizedPublicKey || !isValidSymbolPublicKey(normalizedPublicKey)) {
			return {
				ok: false,
				status: "invalid_public_key",
				message: "publicKey must be a 64-character hex string.",
			};
		}

		const response = await fetchWithTimeout(
			`${nodeUrl.replace(/\/$/, "")}/accounts/${normalizedPublicKey}`,
		);
		if (response.status === 404) {
			return {
				ok: false,
				status: "account_not_found",
				message: "account was not found on the node.",
			};
		}
		if (!response.ok) {
			return {
				ok: false,
				status: "node_unreachable",
				message: `node request failed (${response.status}).`,
			};
		}

		const accountData = (await response.json()) as SymbolAccountResponseDto;
		const mosaics = (accountData.account?.mosaics ?? [])
			.map((mosaic): AccountOwnedMosaic | null => {
				const mosaicIdHex = normalizeMosaicId(mosaic.id);
				const amountRaw = normalizeAmountRaw(mosaic.amount);
				if (!mosaicIdHex || !amountRaw) {
					return null;
				}
				return { mosaicIdHex, amountRaw };
			})
			.filter((mosaic): mosaic is AccountOwnedMosaic => null !== mosaic);

		return {
			ok: true,
			status: "ok",
			publicKey: normalizedPublicKey,
			mosaics,
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
