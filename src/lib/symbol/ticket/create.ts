import { PrivateKey } from 'symbol-sdk';
import { SymbolAccount, SymbolFacade, metadataGenerateKey, metadataUpdateValue, models } from 'symbol-sdk/symbol';
import { randomInt } from "node:crypto";
import { generateAccountFromPrivateKey, generateAccountFromPublicKey } from '../utils/account'
import {
	MosaicFlagOptions,
	CreateMosaicDefinitionTransactionParams,
	CreateMosaicDefinitionTransactionResult,
	buildMosaicFlags,
	createMosaicDefinitionTransaction,
	createMosaicMetadataTransaction,
	createMosaicSupplyIncreaseTransaction,
	createAggregateTransaction,
	toHexMetadataKey,
	toHexMosaicId
} from '../utils/mosaic'
import {
	pollTransactionState
} from '../utils/transaction'
import {
	facade,
	nodeUrl,
	feeMultiplier,
	deadlineHours,
	aggregateType
} from '../config';
import type { TicketMetadata, TicketMetadataThumbnail } from './types';

const INITIAL_SUPPLY = 1n;

type IssueTicketResult =
	| { ok: true; mosaicIdHex: string }
	| { ok: false; error: "node_unreachable" | "announce_failed" | "timeout" | "invalid_metadata"; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
	'object' === typeof value && null !== value;

const isTicketMetadataThumbnail = (value: unknown): value is TicketMetadataThumbnail => {
	if (!isRecord(value))
		return false;

	return (
		'string' === typeof value.filename &&
		'string' === typeof value.mimeType &&
		'number' === typeof value.size &&
		Number.isFinite(value.size) &&
		'string' === typeof value.sha256
	);
};

const isTicketMetadata = (value: unknown): value is TicketMetadata => {
	if (!isRecord(value))
		return false;

	const thumbnail = value.thumbnail;
	return (
		'string' === typeof value.name &&
		'string' === typeof value.detail &&
		'boolean' === typeof value.isUsed &&
		(undefined === thumbnail || isTicketMetadataThumbnail(thumbnail))
	);
};

const normalizeTicketMetadataValue = (
	metadataInput: string | TicketMetadata
): TicketMetadata | null => {
	if ('string' !== typeof metadataInput) {
		return isTicketMetadata(metadataInput) ? metadataInput : null;
	}

	try {
		const parsed = JSON.parse(metadataInput) as unknown;
		return isTicketMetadata(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

export const issueTicketOnChain = async (
	privateKey: string,
	metadataKeySeed: string,
	metadataValue: string | TicketMetadata
): Promise<IssueTicketResult> => {
	const normalizedMetadata = normalizeTicketMetadataValue(metadataValue);
	if (!normalizedMetadata) {
		return {
			ok: false,
			error: "invalid_metadata",
			message: "metadata must include name(string), detail(string), isUsed(boolean).",
		};
	}

	const metadataValueText = JSON.stringify(normalizedMetadata);

	const account = generateAccountFromPrivateKey(facade, privateKey);

	const mosaicFlagOptions: MosaicFlagOptions = {
		// 削除時に供給量を0まで減らせるように供給量変更を許可する。
		mutable: true,
		// MVPではアドレス制限ロジックを使わないため無効化する。
		restrictable: false,
		// 発行者による強制回収を防ぎ、保有者の所有権を維持する。
		revokable: false
	};

	let flags = buildMosaicFlags(mosaicFlagOptions)

	// metadataつきmosaic定義のアグリゲートトランザクションの作成
	const mosaicParams: CreateMosaicDefinitionTransactionParams = {
		duration: 0n,
		nonce: randomInt(0, 0x1_0000_0000),
		flags: flags,
		divisibility: 0
	}


	const { embeddedMosaicDefinition, mosaicId } = createMosaicDefinitionTransaction(
		facade,
		account,
		mosaicParams
	);
	const embeddedMosaicSupplyIncrease = createMosaicSupplyIncreaseTransaction(
		facade,
		account,
		{
			mosaicId,
			delta: INITIAL_SUPPLY
		}
	);

	const metadataKey = metadataGenerateKey(metadataKeySeed);
	const embeddedMosaicMetadata = createMosaicMetadataTransaction(
		facade,
		account,
		{
			mosaicId,
			scopedMetadataKey: metadataKey,
			metadataValue: metadataValueText
		});
	const embeddedTransactions = [embeddedMosaicDefinition, embeddedMosaicSupplyIncrease, embeddedMosaicMetadata];
	const { transaction, transactionsHash } = createAggregateTransaction(
		facade,
		account,
		{
			aggregateType,
			deadlineHours,
			embeddedTransactions,
			feeMultiplier
		});

	// アグリゲートTxを署名してハッシュ/ペイロードを生成する
	const signature = account.signTransaction(transaction);
	const payloadJson = facade.transactionFactory.static.attachSignature(transaction, signature);
	const hash = facade.hashTransaction(transaction).toString();
	const mosaicIdHex = toHexMosaicId(mosaicId);
	const metadataKeyHex = toHexMetadataKey(metadataKey);

	if (!nodeUrl)
		return {
			ok: false,
			error: "node_unreachable",
			message: "SYMBOL_MAINNET_NODE_URL_LIST or SYMBOL_TESTNET_NODE_URL_LIST is required",
		};
	// ノードへ送信し、最終状態を確認する
	const announceRes = await fetch(`${nodeUrl}/transactions`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: payloadJson
	});

	const announceText = await announceRes.text();
	if (!announceRes.ok)
		return {
			ok: false,
			error: "announce_failed",
			message: `Announce failed (${announceRes.status}): ${announceText}`,
		};
	const state = await pollTransactionState(nodeUrl, hash);
	if ('confirmed' === state.state) {
		return {
			ok: true,
			mosaicIdHex: mosaicIdHex
		};
	}

	if ('failed' === state.state) {
		const errorCode =
			typeof state.status.code === "string" && state.status.code
				? state.status.code
				: "unknown_error";
		return {
			ok: false,
			error: "announce_failed",
			message: `Transaction failed: ${errorCode}`,
		};
	}

	return {
		ok: false,
		error: "timeout",
		message: "Transaction confirmation timeout",
	};
}
