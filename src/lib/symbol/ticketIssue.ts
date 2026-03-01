import { randomInt } from "node:crypto";
import { PrivateKey } from "symbol-sdk";
import {
	SymbolFacade,
	descriptors,
	generateMosaicId,
	metadataGenerateKey,
	models,
} from "symbol-sdk/symbol";
import { getSymbolNodeUrlList } from "./utils";

const DEFAULT_FEE_MULTIPLIER = 100;
const MIN_FEE_MULTIPLIER = 1;
const MAX_FEE_MULTIPLIER = 5000;
const TX_DEADLINE_SECONDS = 2 * 60 * 60;

const ISSUE_TICKET_ERROR_CODES = {
	issuer_private_key_missing: "issuer_private_key_missing",
	node_unreachable: "node_unreachable",
	transaction_announce_failed: "transaction_announce_failed",
} as const;

export type IssueTicketErrorCode =
	(typeof ISSUE_TICKET_ERROR_CODES)[keyof typeof ISSUE_TICKET_ERROR_CODES];

export class IssueTicketError extends Error {
	readonly code: IssueTicketErrorCode;

	constructor(code: IssueTicketErrorCode, message: string) {
		super(message);
		this.name = "IssueTicketError";
		this.code = code;
	}
}

export type TicketOnChainMetadata = {
	name: string;
	detail: string;
	isUsed: boolean;
	thumbnail: {
		filename: string;
		mimeType: string;
		size: number;
		sha256: string;
	};
};

export type IssuedTicketResult = {
	mosaicId: string;
	transactionHash: string;
	announcedNodeUrl: string;
	issuerPublicKey: string;
};

type IssueTicketOptions = {
	issuerPrivateKey?: string | null;
};

type SymbolTransactionFeeResponse = {
	averageFeeMultiplier?: string | number;
	medianFeeMultiplier?: string | number;
};

function normalizeIssuerPrivateKey(value: string | undefined) {
	const normalized = (value ?? "").trim().replace(/^0x/i, "").toUpperCase();
	return /^[0-9A-F]{64}$/.test(normalized) ? normalized : null;
}

function toMosaicIdHex(mosaicId: bigint) {
	return mosaicId.toString(16).toUpperCase().padStart(16, "0");
}

function resolveNetworkName() {
	return process.env.SYMBOL_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

function parseFeeMultiplier(value: string | number | undefined) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.min(MAX_FEE_MULTIPLIER, Math.max(MIN_FEE_MULTIPLIER, value));
	}
	if (typeof value === "string") {
		const parsed = Number.parseInt(value, 10);
		if (Number.isFinite(parsed)) {
			return Math.min(
				MAX_FEE_MULTIPLIER,
				Math.max(MIN_FEE_MULTIPLIER, parsed),
			);
		}
	}
	return null;
}

async function fetchFeeMultiplier(nodeUrl: string) {
	try {
		const response = await fetch(
			`${nodeUrl.replace(/\/$/, "")}/network/fees/transaction`,
			{
				method: "GET",
				cache: "no-store",
			},
		);
		if (!response.ok) {
			return DEFAULT_FEE_MULTIPLIER;
		}

		const data = (await response.json()) as SymbolTransactionFeeResponse;
		return (
			parseFeeMultiplier(data.medianFeeMultiplier) ??
			parseFeeMultiplier(data.averageFeeMultiplier) ??
			DEFAULT_FEE_MULTIPLIER
		);
	} catch {
		return DEFAULT_FEE_MULTIPLIER;
	}
}

async function announceTransaction(
	nodeUrlList: string[],
	payload: string,
): Promise<string> {
	const normalizedNodeList = nodeUrlList.map((nodeUrl) => nodeUrl.replace(/\/$/, ""));

	for (const nodeUrl of normalizedNodeList) {
		try {
			const response = await fetch(`${nodeUrl}/transactions`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: payload,
			});

			if (response.ok) {
				return nodeUrl;
			}
		} catch {
			// try next node
		}
	}

	throw new IssueTicketError(
		ISSUE_TICKET_ERROR_CODES.transaction_announce_failed,
		"Symbol transaction announcement failed on all configured nodes.",
	);
}

export async function issueTicketOnChain(
	metadata: TicketOnChainMetadata,
	options: IssueTicketOptions = {},
): Promise<IssuedTicketResult> {
	const issuerPrivateKey = normalizeIssuerPrivateKey(
		options.issuerPrivateKey ?? process.env.SYMBOL_TICKET_ISSUER_PRIVATE_KEY,
	);
	if (!issuerPrivateKey) {
		throw new IssueTicketError(
			ISSUE_TICKET_ERROR_CODES.issuer_private_key_missing,
			"SYMBOL_TICKET_ISSUER_PRIVATE_KEY is missing or invalid.",
		);
	}

	const nodeUrlList = getSymbolNodeUrlList();
	if (!nodeUrlList.length) {
		throw new IssueTicketError(
			ISSUE_TICKET_ERROR_CODES.node_unreachable,
			"No Symbol node URL is configured.",
		);
	}

	const metadataValue = JSON.stringify(metadata);
	const metadataValueSize = new TextEncoder().encode(metadataValue).length;

	const facade = new SymbolFacade(resolveNetworkName());
	const issuerAccount = facade.createAccount(new PrivateKey(issuerPrivateKey));
	const nonce = randomInt(0, 0x1_0000_0000);
	const mosaicId = generateMosaicId(issuerAccount.address, nonce);

	const embeddedTransactions = [
		facade.createEmbeddedTransactionFromTypedDescriptor(
			new descriptors.MosaicDefinitionTransactionV1Descriptor(
				new models.MosaicId(mosaicId),
				new models.BlockDuration(0n),
				new models.MosaicNonce(nonce),
				new models.MosaicFlags(models.MosaicFlags.TRANSFERABLE.value),
				0,
			),
			issuerAccount.publicKey,
		),
		facade.createEmbeddedTransactionFromTypedDescriptor(
			new descriptors.MosaicSupplyChangeTransactionV1Descriptor(
				new models.UnresolvedMosaicId(mosaicId),
				new models.Amount(1n),
				models.MosaicSupplyChangeAction.INCREASE,
			),
			issuerAccount.publicKey,
		),
		facade.createEmbeddedTransactionFromTypedDescriptor(
			new descriptors.MosaicMetadataTransactionV1Descriptor(
				issuerAccount.address,
				metadataGenerateKey("ticket:info/v1"),
				new models.UnresolvedMosaicId(mosaicId),
				metadataValueSize,
				metadataValue,
			),
			issuerAccount.publicKey,
		),
	];

	const feeMultiplier = await fetchFeeMultiplier(nodeUrlList[0]);
	const aggregateDescriptor = new descriptors.AggregateCompleteTransactionV2Descriptor(
		SymbolFacade.hashEmbeddedTransactions(embeddedTransactions),
		embeddedTransactions,
		[],
	);

	const aggregateTransaction = facade.createTransactionFromTypedDescriptor(
		aggregateDescriptor,
		issuerAccount.publicKey,
		feeMultiplier,
		TX_DEADLINE_SECONDS,
	);
	const signature = issuerAccount.signTransaction(aggregateTransaction);
	const signedPayload = facade.transactionFactory.static.attachSignature(
		aggregateTransaction,
		signature,
	);
	const transactionHash = facade.hashTransaction(aggregateTransaction).toString();

	const announcedNodeUrl = await announceTransaction(nodeUrlList, signedPayload);

	return {
		mosaicId: toMosaicIdHex(mosaicId),
		transactionHash,
		announcedNodeUrl,
		issuerPublicKey: issuerAccount.publicKey.toString(),
	};
}
