import { models } from "symbol-sdk/symbol";
import {
	deadlineHours,
	facade,
	feeMultiplier,
	nodeUrl,
} from "../config";
import { generateAccountFromPrivateKey, generateAccountFromPublicKey } from "../utils/account";
import {
	fetchWithTimeout,
	isValidSymbolPublicKey,
	normalizeSymbolPublicKey,
} from "../utils";
import { pollTransactionState } from "../utils/transaction";

const SYMBOL_REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_XYM_DIVISIBILITY = 6;
const FALLBACK_CURRENCY_MOSAIC_ID: Record<"mainnet" | "testnet", string> = {
	mainnet: "6BED913FA20223F8",
	testnet: "72C0212E67A08BCE",
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

export type SendXymOnChainResult =
	| {
			ok: true;
			status: "ok";
			transactionHash: string;
			recipientAddress: string;
			amountRaw: string;
	  }
	| {
			ok: false;
			status:
				| "invalid_sender_private_key"
				| "invalid_recipient_public_key"
				| "invalid_amount"
				| "node_unreachable"
				| "announce_failed"
				| "timeout"
				| "send_failed";
			message: string;
	  };

const normalizeMosaicId = (mosaicId: string | undefined | null) => {
	if (!mosaicId) {
		return null;
	}
	const normalized = mosaicId.trim().replace(/^0x/i, "").toUpperCase();
	return /^[0-9A-F]{16}$/.test(normalized) ? normalized : null;
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

export const sendXymOnChain = async (
	senderPrivateKey: string,
	recipientPublicKey: string,
	amountRaw: bigint,
	message = "",
): Promise<SendXymOnChainResult> => {
	if (amountRaw <= 0n) {
		return {
			ok: false,
			status: "invalid_amount",
			message: "amountRaw must be greater than 0.",
		};
	}

	const normalizedRecipientPublicKey = normalizeSymbolPublicKey(recipientPublicKey);
	if (
		!normalizedRecipientPublicKey ||
		!isValidSymbolPublicKey(normalizedRecipientPublicKey)
	) {
		return {
			ok: false,
			status: "invalid_recipient_public_key",
			message: "recipientPublicKey must be a 64-character hex string.",
		};
	}

	let senderAccount;
	try {
		senderAccount = generateAccountFromPrivateKey(facade, senderPrivateKey);
	} catch (error) {
		const messageText = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			status: "invalid_sender_private_key",
			message: messageText,
		};
	}

	try {
		const recipientAccount = generateAccountFromPublicKey(
			facade,
			normalizedRecipientPublicKey,
		);
		const currencyInfo = await fetchCurrencyInfo();
		const currencyMosaicId = BigInt(`0x${currencyInfo.mosaicId}`);

		const transactionDescriptor: Record<string, unknown> = {
			type: "transfer_transaction_v1",
			signerPublicKey: senderAccount.publicKey,
			fee: 0n,
			deadline: facade.now().addHours(deadlineHours).timestamp,
			recipientAddress: recipientAccount.address,
			mosaics: [{ mosaicId: currencyMosaicId, amount: amountRaw }],
		};
		if (message) {
			transactionDescriptor.message = message;
		}

		const transaction = facade.transactionFactory.create(transactionDescriptor);
		transaction.fee = new models.Amount(
			BigInt(transaction.size) * BigInt(feeMultiplier),
		);

		const signature = senderAccount.signTransaction(transaction);
		const payloadJson = facade.transactionFactory.static.attachSignature(
			transaction,
			signature,
		);
		const hash = facade.hashTransaction(transaction).toString();

		let announceRes: Response;
		try {
			announceRes = await fetch(`${nodeUrl}/transactions`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: payloadJson,
			});
		} catch (error) {
			const messageText = error instanceof Error ? error.message : String(error);
			return {
				ok: false,
				status: "node_unreachable",
				message: messageText,
			};
		}

		const announceText = await announceRes.text();
		if (!announceRes.ok) {
			return {
				ok: false,
				status: "announce_failed",
				message: `Announce failed (${announceRes.status}): ${announceText}`,
			};
		}

		const state = await pollTransactionState(nodeUrl, hash);
		if ("confirmed" === state.state) {
			return {
				ok: true,
				status: "ok",
				transactionHash: hash,
				recipientAddress: recipientAccount.address.toString(),
				amountRaw: amountRaw.toString(),
			};
		}

		if ("failed" === state.state) {
			const errorCode =
				typeof state.status.code === "string" && state.status.code
					? state.status.code
					: "unknown_error";
			return {
				ok: false,
				status: "announce_failed",
				message: `Transaction failed: ${errorCode}`,
			};
		}

		return {
			ok: false,
			status: "timeout",
			message: "Transaction confirmation timeout",
		};
	} catch (error) {
		const messageText = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			status: "send_failed",
			message: messageText,
		};
	}
};
