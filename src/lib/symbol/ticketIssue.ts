import { randomInt } from "node:crypto";
import { PrivateKey, PublicKey } from "symbol-sdk";
import {
	SymbolFacade,
	descriptors,
	metadataGenerateKey,
	models,
} from "symbol-sdk/symbol";
import { getSymbolNodeUrlList } from "./utils";

const DEFAULT_FEE_MULTIPLIER = 100;
const MIN_FEE_MULTIPLIER = 1;
const MAX_FEE_MULTIPLIER = 5000;
const TX_DEADLINE_SECONDS = 2 * 60 * 60;
const TX_CONFIRM_TIMEOUT_MS = 10000;
const TX_CONFIRM_INTERVAL_MS = 1500;

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
	recipientPublicKey?: string | null;
};

type SymbolTransactionFeeResponse = {
	averageFeeMultiplier?: string | number;
	medianFeeMultiplier?: string | number;
};

type SymbolTransactionStatusResponse = {
	hash?: string;
	code?: string;
	group?: string;
	deadline?: string;
	height?: string;
};

function normalizeIssuerPrivateKey(value: string | undefined) {
	const normalized = (value ?? "").trim().replace(/^0x/i, "").toUpperCase();
	return /^[0-9A-F]{64}$/.test(normalized) ? normalized : null;
}

function normalizePublicKey(value: string | null | undefined) {
	const normalized = (value ?? "").trim().replace(/^0x/i, "").toUpperCase();
	return /^[0-9A-F]{64}$/.test(normalized) ? normalized : null;
}

function toMosaicIdHex(mosaicId: bigint) {
	return mosaicId.toString(16).toUpperCase().padStart(16, "0");
}

function toTransactionHashHex(value: string) {
	const normalized = value.trim().replace(/^0x/i, "").toUpperCase();
	return normalized.padStart(64, "0");
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

async function waitForTransactionResult(
	nodeUrlList: string[],
	hash: string,
	timeoutMs = TX_CONFIRM_TIMEOUT_MS,
	intervalMs = TX_CONFIRM_INTERVAL_MS,
): Promise<
	| { state: "confirmed"; confirmedNodeUrl: string }
	| { state: "failed"; status: SymbolTransactionStatusResponse }
	| { state: "timeout" }
> {
	const startedAt = Date.now();

	while (Date.now() - startedAt < timeoutMs) {
		for (const nodeUrl of nodeUrlList) {
			const normalizedNodeUrl = nodeUrl.replace(/\/$/, "");
			try {
				const confirmedResponse = await fetch(
					`${normalizedNodeUrl}/transactions/confirmed/${hash}`,
					{
						method: "GET",
						cache: "no-store",
					},
				);
				if (confirmedResponse.ok) {
					return { state: "confirmed", confirmedNodeUrl: normalizedNodeUrl };
				}

				const statusResponse = await fetch(
					`${normalizedNodeUrl}/transactionStatus/${hash}`,
					{
						method: "GET",
						cache: "no-store",
					},
				);
				if (!statusResponse.ok) {
					continue;
				}

				const status = (await statusResponse.json()) as SymbolTransactionStatusResponse;
				if (
					typeof status.code === "string" &&
					status.code &&
					status.code.toLowerCase() !== "success"
				) {
					return { state: "failed", status };
				}
			} catch {
				// try next node
			}
		}

		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	return { state: "timeout" };
}

function createSignedTransactionPayload(
	facade: SymbolFacade,
	issuerAccount: ReturnType<SymbolFacade["createAccount"]>,
	rawDescriptor: object,
	feeMultiplier: number,
) {
	const tx = facade.transactionFactory.create({
		...rawDescriptor,
		signerPublicKey: issuerAccount.publicKey,
		fee: 0n,
		deadline: facade.now().addSeconds(TX_DEADLINE_SECONDS).timestamp,
	});
	tx.fee = new models.Amount(BigInt(tx.size) * BigInt(feeMultiplier));
	const signature = issuerAccount.signTransaction(tx);
	return {
		payload: facade.transactionFactory.static.attachSignature(tx, signature),
		hash: toTransactionHashHex(facade.hashTransaction(tx).toString()),
		tx,
	};
}

export async function issueTicketOnChain(
	metadata: TicketOnChainMetadata,
	options: IssueTicketOptions = {},
): Promise<IssuedTicketResult> {
	const issuerPrivateKey = normalizeIssuerPrivateKey(options.issuerPrivateKey);
	if (!issuerPrivateKey) {
		throw new IssueTicketError(
			ISSUE_TICKET_ERROR_CODES.issuer_private_key_missing,
			"issuerPrivateKey is missing or invalid.",
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
	const normalizedRecipientPublicKey = normalizePublicKey(
		options.recipientPublicKey,
	);
	const recipientAddress = normalizedRecipientPublicKey
		? facade.createPublicAccount(new PublicKey(normalizedRecipientPublicKey)).address
		: issuerAccount.address;
	const nonce = randomInt(0, 0x1_0000_0000);
	const feeMultiplier = await fetchFeeMultiplier(nodeUrlList[0]);

	const definePayload = createSignedTransactionPayload(
		facade,
		issuerAccount,
		{
			type: "mosaic_definition_transaction_v1",
			id: 0n,
			duration: 0n,
			nonce,
			flags: new models.MosaicFlags(models.MosaicFlags.TRANSFERABLE.value),
			divisibility: 0,
		},
		feeMultiplier,
	);
	const defineAnnouncedNodeUrl = await announceTransaction(
		nodeUrlList,
		definePayload.payload,
	);
	const defineResult = await waitForTransactionResult(
		nodeUrlList,
		definePayload.hash,
	);
	if (defineResult.state === "failed") {
		throw new IssueTicketError(
			ISSUE_TICKET_ERROR_CODES.transaction_announce_failed,
			`Mosaic definition failed: ${defineResult.status.code ?? "unknown_error"}`,
		);
	}
	if (defineResult.state === "timeout") {
		throw new IssueTicketError(
			ISSUE_TICKET_ERROR_CODES.transaction_announce_failed,
			"Mosaic definition confirmation timeout.",
		);
	}
	const mosaicId = definePayload.tx.id.value;

	const supplyDescriptor = new descriptors.MosaicSupplyChangeTransactionV1Descriptor(
		new models.UnresolvedMosaicId(mosaicId),
		new models.Amount(1n),
		models.MosaicSupplyChangeAction.INCREASE,
	);
	const transferDescriptor = new descriptors.TransferTransactionV1Descriptor(
		recipientAddress,
		[
			new descriptors.UnresolvedMosaicDescriptor(
				new models.UnresolvedMosaicId(mosaicId),
				new models.Amount(1n),
			),
		],
	);
	const metadataDescriptor = new descriptors.MosaicMetadataTransactionV1Descriptor(
		issuerAccount.address,
		metadataGenerateKey("ticket:info/v1"),
		new models.UnresolvedMosaicId(mosaicId),
		metadataValueSize,
		metadataValue,
	);

	const stagedTransactions = [
		createSignedTransactionPayload(
			facade,
			issuerAccount,
			supplyDescriptor.toMap(),
			feeMultiplier,
		),
		createSignedTransactionPayload(
			facade,
			issuerAccount,
			transferDescriptor.toMap(),
			feeMultiplier,
		),
		createSignedTransactionPayload(
			facade,
			issuerAccount,
			metadataDescriptor.toMap(),
			feeMultiplier,
		),
	];
	let announcedNodeUrl = defineAnnouncedNodeUrl;
	let lastTransactionHash = definePayload.hash;
	for (const stagedTransaction of stagedTransactions) {
		announcedNodeUrl = await announceTransaction(
			nodeUrlList,
			stagedTransaction.payload,
		);
		const stagedResult = await waitForTransactionResult(
			nodeUrlList,
			stagedTransaction.hash,
		);
		if (stagedResult.state === "failed") {
			throw new IssueTicketError(
				ISSUE_TICKET_ERROR_CODES.transaction_announce_failed,
				`Ticket issue flow failed: ${stagedResult.status.code ?? "unknown_error"}`,
			);
		}
		if (stagedResult.state === "timeout") {
			throw new IssueTicketError(
				ISSUE_TICKET_ERROR_CODES.transaction_announce_failed,
				"Ticket issue flow confirmation timeout.",
			);
		}
		lastTransactionHash = stagedTransaction.hash;
	}

	return {
		mosaicId: toMosaicIdHex(mosaicId),
		transactionHash: lastTransactionHash,
		announcedNodeUrl,
		issuerPublicKey: issuerAccount.publicKey.toString(),
	};
}
