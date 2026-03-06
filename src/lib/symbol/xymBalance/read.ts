import { nodeUrl } from "../config";
import {
	fetchWithTimeout,
	isValidSymbolPublicKey,
	normalizeSymbolPublicKey,
} from "../utils";

const SYMBOL_REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_XYM_DIVISIBILITY = 6;
const FALLBACK_CURRENCY_MOSAIC_ID: Record<"mainnet" | "testnet", string> = {
	mainnet: "6BED913FA20223F8",
	testnet: "72C0212E67A08BCE",
};

type SymbolAccountResponse = {
	account?: {
		mosaics?: Array<{
			id?: string;
			amount?: string;
		}>;
	};
};

type SymbolNetworkCurrencyResponse = {
	mosaicId?: string;
	id?: string;
	divisibility?: number;
	mosaic?: {
		id?: string;
		divisibility?: number;
	};
};

type CurrencyInfo = {
	mosaicId: string;
	divisibility: number;
};

export type ReadXymBalanceResult =
	| {
			ok: true;
			status: "ok";
			publicKey: string;
			balance: {
				amountRaw: string;
				amountDisplay: string;
				currencyMosaicId: string;
				divisibility: number;
			};
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

const normalizeMosaicId = (mosaicId: string | undefined | null) => {
	if (!mosaicId) {
		return null;
	}
	const normalized = mosaicId.trim().replace(/^0x/i, "").toUpperCase();
	return /^[0-9A-F]{16}$/.test(normalized) ? normalized : null;
};

const formatAmount = (rawAmount: bigint, divisibility: number) => {
	const base = 10n ** BigInt(divisibility);
	const whole = rawAmount / base;
	const fraction = rawAmount % base;
	if (fraction === 0n) {
		return whole.toString();
	}

	const paddedFraction = fraction.toString().padStart(divisibility, "0");
	const trimmedFraction = paddedFraction.replace(/0+$/, "");
	return `${whole.toString()}.${trimmedFraction}`;
};

const getFallbackCurrencyInfo = (): CurrencyInfo => {
	const network = process.env.SYMBOL_NETWORK === "mainnet" ? "mainnet" : "testnet";
	return {
		mosaicId: FALLBACK_CURRENCY_MOSAIC_ID[network],
		divisibility: DEFAULT_XYM_DIVISIBILITY,
	};
};

const fetchCurrencyInfo = async (): Promise<CurrencyInfo> => {
	try {
		const response = await fetchWithTimeout(
			`${nodeUrl.replace(/\/$/, "")}/network/currency`,
			SYMBOL_REQUEST_TIMEOUT_MS,
		);
		if (!response.ok) {
			return getFallbackCurrencyInfo();
		}

		const data = (await response.json()) as SymbolNetworkCurrencyResponse;
		const mosaicId = normalizeMosaicId(
			data.mosaicId ?? data.id ?? data.mosaic?.id,
		);
		const divisibility =
			typeof data.divisibility === "number"
				? data.divisibility
				: typeof data.mosaic?.divisibility === "number"
					? data.mosaic.divisibility
					: DEFAULT_XYM_DIVISIBILITY;

		if (!mosaicId) {
			return getFallbackCurrencyInfo();
		}
		return { mosaicId, divisibility };
	} catch {
		return getFallbackCurrencyInfo();
	}
};

export const readXymBalanceByPublicKey = async (
	inputPublicKey: string | null | undefined,
): Promise<ReadXymBalanceResult> => {
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

		const accountResponse = await fetchWithTimeout(
			`${nodeUrl.replace(/\/$/, "")}/accounts/${normalizedPublicKey}`,
			SYMBOL_REQUEST_TIMEOUT_MS,
		);

		if (accountResponse.status === 404) {
			return {
				ok: false,
				status: "account_not_found",
				message: "account was not found on the node.",
			};
		}

		if (!accountResponse.ok) {
			return {
				ok: false,
				status: "node_unreachable",
				message: `node request failed (${accountResponse.status}).`,
			};
		}

		const accountData = (await accountResponse.json()) as SymbolAccountResponse;
		const mosaics = accountData.account?.mosaics ?? [];
		const currencyInfo = await fetchCurrencyInfo();
		const targetMosaic = mosaics.find(
			(mosaic) => normalizeMosaicId(mosaic.id) === currencyInfo.mosaicId,
		);
		const amountRaw = targetMosaic?.amount ?? "0";
		const amountDisplay = formatAmount(
			BigInt(amountRaw),
			currencyInfo.divisibility,
		);

		return {
			ok: true,
			status: "ok",
			publicKey: normalizedPublicKey,
			balance: {
				amountRaw,
				amountDisplay,
				currencyMosaicId: currencyInfo.mosaicId,
				divisibility: currencyInfo.divisibility,
			},
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
