import { generateAccountFromPrivateKey } from '../../utils/accounts';
import {
	createAggregateTransaction,
	createMosaicSupplyDecreaseTransaction,
	createMosaicSupplyIncreaseTransaction,
} from '../../utils/transaction-builders';
import { announceTransaction, getMosaicWithMetadata, pollTransactionState } from '../../utils/node-client';
import { aggregateType, deadlineHours, facade, feeMultiplier, nodeUrl } from '../../config';
import { normalizeMosaicIdHex } from '../../utils/normalizers';

type UpdateCurrencySupplyResult =
	| Readonly<{
			ok: true;
			status: 'ok';
			mosaicIdHex: string;
			previousSupplyRaw: string;
			currentSupplyRaw: string;
	  }>
	| Readonly<{
			ok: false;
			status:
				| 'invalid_mosaic_id'
				| 'invalid_supply'
				| 'node_unreachable'
				| 'announce_failed'
				| 'timeout'
				| 'update_failed';
			message: string;
	  }>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	'object' === typeof value && null !== value;

const parseBigIntLike = (value: unknown): bigint | null => {
	if ('bigint' === typeof value) {
		return value;
	}
	if ('number' === typeof value && Number.isFinite(value)) {
		return BigInt(Math.trunc(value));
	}
	if ('string' !== typeof value) {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	try {
		if (/^0x/i.test(trimmed)) {
			return BigInt(trimmed);
		}
		if (/^[0-9A-Fa-f]+$/.test(trimmed) && /[A-Fa-f]/.test(trimmed)) {
			return BigInt(`0x${trimmed}`);
		}
		return BigInt(trimmed);
	} catch {
		return null;
	}
};

const normalizeTargetSupply = (value: bigint | number | string): bigint | null => {
	const parsed = parseBigIntLike(value);
	if (null === parsed || parsed < 0n) {
		return null;
	}
	return parsed;
};

const extractCurrentSupply = (mosaic: Record<string, unknown>): bigint | null => {
	const directSupply = parseBigIntLike(mosaic.supply);
	if (null !== directSupply && directSupply >= 0n) {
		return directSupply;
	}

	if (isRecord(mosaic.mosaic)) {
		const nestedSupply = parseBigIntLike(mosaic.mosaic.supply);
		if (null !== nestedSupply && nestedSupply >= 0n) {
			return nestedSupply;
		}
	}

	return null;
};

export const updateFamilyCurrencySupplyOnChain = async (
	privateKey: string,
	mosaicIdHex: string,
	nextSupply: bigint | number | string
): Promise<UpdateCurrencySupplyResult> => {
	let normalizedMosaicIdHex: string;
	try {
		normalizedMosaicIdHex = normalizeMosaicIdHex(mosaicIdHex);
		if (!/^[0-9A-F]{16}$/.test(normalizedMosaicIdHex)) {
			throw new Error('invalid mosaic id');
		}
	} catch {
		return {
			ok: false,
			status: 'invalid_mosaic_id',
			message: 'mosaicIdHex must be a 16-character hex string with optional 0x prefix.'
		};
	}

	const targetSupply = normalizeTargetSupply(nextSupply);
	if (null === targetSupply) {
		return {
			ok: false,
			status: 'invalid_supply',
			message: 'nextSupply must be a zero or positive integer.'
		};
	}

	if (!nodeUrl) {
		return {
			ok: false,
			status: 'node_unreachable',
			message: 'SYMBOL_MAINNET_NODE_URL_LIST or SYMBOL_TESTNET_NODE_URL_LIST is required'
		};
	}

	try {
		const mosaicId = BigInt(`0x${normalizedMosaicIdHex}`);
		const account = generateAccountFromPrivateKey(facade, privateKey);
		const mosaicWithMetadata = await getMosaicWithMetadata(nodeUrl, normalizedMosaicIdHex);
		const currentSupply = extractCurrentSupply(
			mosaicWithMetadata.mosaic as Record<string, unknown>
		);

		if (null === currentSupply) {
			return {
				ok: false,
				status: 'update_failed',
				message: 'failed to read current mosaic supply.'
			};
		}

		if (currentSupply === targetSupply) {
			return {
				ok: true,
				status: 'ok',
				mosaicIdHex: `0x${normalizedMosaicIdHex}`,
				previousSupplyRaw: currentSupply.toString(),
				currentSupplyRaw: targetSupply.toString()
			};
		}

		const delta = targetSupply > currentSupply
			? targetSupply - currentSupply
			: currentSupply - targetSupply;
		const embeddedSupplyTransaction = targetSupply > currentSupply
			? createMosaicSupplyIncreaseTransaction(
				facade,
				account,
				{
					mosaicId,
					delta
				}
			)
			: createMosaicSupplyDecreaseTransaction(
				facade,
				account,
				{
					mosaicId,
					delta
				}
			);

		const { transaction } = createAggregateTransaction(
			facade,
			account,
			{
				aggregateType,
				deadlineHours,
				embeddedTransactions: [embeddedSupplyTransaction],
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
				status: 'network_error' === announceResult.error ? 'node_unreachable' : 'announce_failed',
				message: announceResult.message,
			};
		}

		const state = await pollTransactionState(nodeUrl, hash);
		if ('confirmed' === state.state) {
			return {
				ok: true,
				status: 'ok',
				mosaicIdHex: `0x${normalizedMosaicIdHex}`,
				previousSupplyRaw: currentSupply.toString(),
				currentSupplyRaw: targetSupply.toString()
			};
		}

		if ('failed' === state.state) {
			const errorCode =
				typeof state.status.code === 'string' && state.status.code
					? state.status.code
					: 'unknown_error';
			return {
				ok: false,
				status: 'announce_failed',
				message: `Transaction failed: ${errorCode}`,
			};
		}

		return {
			ok: false,
			status: 'timeout',
			message: 'Transaction confirmation timeout',
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			status: 'update_failed',
			message
		};
	}
};

export type { UpdateCurrencySupplyResult };
