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

const INITIAL_SUPPLY = 1n;

type IssueTicketResult =
	| { ok: true; mosaicId: string }
	| { ok: false; error: "node_unreachable" | "announce_failed" | "timeout"; message: string };

export const issueTicketOnChain = async (
	privateKey: string,
	metadataKeySeed: string,
	metadataValueText: string
): Promise<IssueTicketResult> => {

	const account = generateAccountFromPrivateKey(facade, privateKey);

	const mosaicFlagOptions: MosaicFlagOptions = {
		// 供給量を固定し、発行後に枚数を増減できないようにする。
		mutable: false,
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

	console.log(`Node URL        : ${nodeUrl}`);
	console.log('Mode            : ANNOUNCE');

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

	console.log(`Announce result : ${announceText}`);
	console.log('Waiting for confirmation...');

	const state = await pollTransactionState(nodeUrl, hash);
	if ('confirmed' === state.state) {
		console.log('Final state     : CONFIRMED');
		return {
			ok: true,
			mosaicId: mosaicIdHex
		};
	}

	if ('failed' === state.state) {
		console.log('Final state     : FAILED');
		console.log(JSON.stringify(state.status, null, 2));
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

	console.log('Final state     : TIMEOUT (not confirmed within 120s)');
	if (state.status)
		console.log(`Last status     : ${JSON.stringify(state.status)}`);
	console.log(`Check manually  : ${nodeUrl}/transactionStatus/${hash}`);
	return {
		ok: false,
		error: "timeout",
		message: "Transaction confirmation timeout",
	};
}
