import { randomInt } from 'node:crypto';
import { metadataGenerateKey } from 'symbol-sdk/symbol';
import { generateAccountFromPrivateKey } from '../../utils/accounts';
import {
	type CreateMosaicDefinitionTransactionParams,
	type MosaicFlagOptions,
	buildMosaicFlags,
	createAggregateTransaction,
	createMosaicDefinitionTransaction,
	createMosaicMetadataTransaction,
	createMosaicSupplyIncreaseTransaction,
} from '../../utils/transaction-builders';
import { toHexMosaicId } from '../../utils/normalizers';
import { announceTransaction, pollTransactionState } from '../../utils/node-client';
import { aggregateType, deadlineHours, facade, feeMultiplier, nodeUrl } from '../../config';
import type { VoiceMetadata } from './schema';

type IssueVoiceResult =
	| Readonly<{
			ok: true;
			mosaicIdHex: string;
	  }>
	| Readonly<{
			ok: false;
			error:
				| 'invalid_metadata'
				| 'invalid_supply'
				| 'invalid_divisibility'
				| 'node_unreachable'
				| 'announce_failed'
				| 'timeout';
			message: string;
	  }>;

type IssueVoiceOptions = Readonly<{
	initialSupply?: bigint | number | string;
	divisibility?: number;
	duration?: bigint | number | string;
}>;

const DEFAULT_INITIAL_SUPPLY = 1000n;
const DEFAULT_DIVISIBILITY = 0;
const DEFAULT_DURATION = 0n;
const MAX_DIVISIBILITY = 6;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	'object' === typeof value && null !== value;

const isVoiceMetadata = (value: unknown): value is VoiceMetadata => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		'string' === typeof value.name &&
		0 < value.name.trim().length &&
		'string' === typeof value.detail &&
		0 < value.detail.trim().length
	);
};

const normalizeVoiceMetadataValue = (
	metadataInput: string | VoiceMetadata
): VoiceMetadata | null => {
	if ('string' !== typeof metadataInput) {
		return isVoiceMetadata(metadataInput) ? metadataInput : null;
	}

	try {
		const parsed = JSON.parse(metadataInput) as unknown;
		return isVoiceMetadata(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

const parseBigIntLike = (value: bigint | number | string | undefined): bigint | null => {
	if (undefined === value) {
		return null;
	}
	if ('bigint' === typeof value) {
		return value;
	}
	if ('number' === typeof value) {
		if (!Number.isFinite(value) || !Number.isInteger(value)) {
			return null;
		}
		return BigInt(value);
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	try {
		if (/^0x/i.test(trimmed)) {
			return BigInt(trimmed);
		}
		return BigInt(trimmed);
	} catch {
		return null;
	}
};

const normalizeIssueVoiceOptions = (
	options: IssueVoiceOptions | undefined
): Readonly<{
	initialSupply: bigint;
	divisibility: number;
	duration: bigint;
} | null> => {
	const initialSupply = undefined === options?.initialSupply
		? DEFAULT_INITIAL_SUPPLY
		: parseBigIntLike(options.initialSupply);
	if (null === initialSupply || initialSupply <= 0n) {
		return null;
	}

	const duration = undefined === options?.duration
		? DEFAULT_DURATION
		: parseBigIntLike(options.duration);
	if (null === duration || duration < 0n) {
		return null;
	}

	const divisibility = options?.divisibility ?? DEFAULT_DIVISIBILITY;
	if (!Number.isInteger(divisibility) || divisibility < 0 || divisibility > MAX_DIVISIBILITY) {
		return null;
	}

	return {
		initialSupply,
		divisibility,
		duration,
	};
};

export const issueFamilyVoiceOnChain = async (
	privateKey: string,
	metadataKeySeed: string,
	metadataValue: string | VoiceMetadata,
	options?: IssueVoiceOptions
): Promise<IssueVoiceResult> => {
	const normalizedMetadata = normalizeVoiceMetadataValue(metadataValue);
	if (!normalizedMetadata) {
		return {
			ok: false,
			error: 'invalid_metadata',
			message: 'metadata must include name(string) and detail(string).'
		};
	}

	const normalizedOptions = normalizeIssueVoiceOptions(options);
	if (!normalizedOptions) {
		const divisibility = options?.divisibility;
		return {
			ok: false,
			error:
				undefined !== divisibility &&
				(!Number.isInteger(divisibility) || divisibility < 0 || divisibility > MAX_DIVISIBILITY)
					? 'invalid_divisibility'
					: 'invalid_supply',
			message:
				undefined !== divisibility &&
				(!Number.isInteger(divisibility) || divisibility < 0 || divisibility > MAX_DIVISIBILITY)
					? `divisibility must be an integer between 0 and ${MAX_DIVISIBILITY}.`
					: 'initialSupply must be a positive integer and duration must be zero or greater.'
		};
	}

	if (!nodeUrl) {
		return {
			ok: false,
			error: 'node_unreachable',
			message: 'SYMBOL_MAINNET_NODE_URL_LIST or SYMBOL_TESTNET_NODE_URL_LIST is required',
		};
	}

	const metadataValueText = JSON.stringify(normalizedMetadata);
	const account = generateAccountFromPrivateKey(facade, privateKey);

	const mosaicFlagOptions: MosaicFlagOptions = {
		mutable: true,
		restrictable: false,
		revokable: false
	};
	const flags = buildMosaicFlags(mosaicFlagOptions);

	const mosaicParams: CreateMosaicDefinitionTransactionParams = {
		duration: normalizedOptions.duration,
		nonce: randomInt(0, 0x1_0000_0000),
		flags,
		divisibility: normalizedOptions.divisibility
	};

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
			delta: normalizedOptions.initialSupply
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
		}
	);

	const { transaction } = createAggregateTransaction(
		facade,
		account,
		{
			aggregateType,
			deadlineHours,
			embeddedTransactions: [
				embeddedMosaicDefinition,
				embeddedMosaicSupplyIncrease,
				embeddedMosaicMetadata
			],
			feeMultiplier
		}
	);

	const signature = account.signTransaction(transaction);
	const payloadJson = facade.transactionFactory.static.attachSignature(transaction, signature);
	const hash = facade.hashTransaction(transaction).toString();

	const announceResult = await announceTransaction(nodeUrl, payloadJson);
	if (!announceResult.ok) {
		return {
			ok: false,
			error: 'network_error' === announceResult.error ? 'node_unreachable' : 'announce_failed',
			message: announceResult.message,
		};
	}

	const state = await pollTransactionState(nodeUrl, hash);
	if ('confirmed' === state.state) {
		return {
			ok: true,
			mosaicIdHex: toHexMosaicId(mosaicId)
		};
	}

	if ('failed' === state.state) {
		const errorCode =
			typeof state.status.code === 'string' && state.status.code
				? state.status.code
				: 'unknown_error';
		return {
			ok: false,
			error: 'announce_failed',
			message: `Transaction failed: ${errorCode}`,
		};
	}

	return {
		ok: false,
		error: 'timeout',
		message: 'Transaction confirmation timeout',
	};
};

export type { IssueVoiceOptions, IssueVoiceResult };
