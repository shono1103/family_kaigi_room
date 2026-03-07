import { metadataGenerateKey, metadataUpdateValue, models } from 'symbol-sdk/symbol';
import type { TicketMetadata, TicketMetadataThumbnail } from './types';
import { generateAccountFromPrivateKey } from '../../utils/accounts';
import { createAggregateTransaction } from '../../utils/transaction-builders';
import { announceTransaction, pollTransactionState, getMosaicWithMetadata } from '../../utils/node-client';
import { aggregateType, deadlineHours, facade, feeMultiplier, nodeUrl } from '../../config';

type UpdateTicketResult =
	| { ok: true; status: 'ok'; mosaicIdHex: string }
	| { ok: false; status: 'invalid_metadata' | 'metadata_not_found' | 'node_unreachable' | 'announce_failed' | 'timeout' | 'update_failed'; message: string };

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

const normalizeMosaicIdHex = (mosaicIdHex: string): string =>
	mosaicIdHex.trim().replace(/^0x/i, '').toUpperCase();

const parseBigIntLike = (value: unknown): bigint | null => {
	if ('bigint' === typeof value)
		return value;
	if ('number' === typeof value && Number.isFinite(value))
		return BigInt(Math.trunc(value));
	if ('string' !== typeof value)
		return null;

	const trimmed = value.trim();
	if (!trimmed)
		return null;

	try {
		if (/^0x/i.test(trimmed))
			return BigInt(trimmed);
		if (/^[0-9A-Fa-f]+$/.test(trimmed) && /[A-Fa-f]/.test(trimmed))
			return BigInt(`0x${trimmed}`);
		return BigInt(trimmed);
	} catch {
		return null;
	}
};

const decodeHexToBytes = (hex: string): Uint8Array | null => {
	if (!/^[0-9A-Fa-f]+$/.test(hex) || 0 !== hex.length % 2)
		return null;

	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
};

const extractExistingMetadataValueBytes = (
	metadataEntries: ReadonlyArray<Record<string, unknown>>,
	scopedMetadataKey: bigint
): Uint8Array | null => {
	for (const entry of metadataEntries) {
		const entryKey = parseBigIntLike(entry.scopedMetadataKey);
		if (entryKey !== scopedMetadataKey)
			continue;

		if ('string' !== typeof entry.value)
			continue;

		const decoded = decodeHexToBytes(entry.value);
		if (decoded)
			return decoded;

		return new TextEncoder().encode(entry.value);
	}

	return null;
};

export const updateTicketOnChain = async (
	privateKey: string,
	metadataKeySeed: string,
	mosaicIdHex: string,
	nextMetadata: string | TicketMetadata
): Promise<UpdateTicketResult> => {
	const normalizedMetadata = normalizeTicketMetadataValue(nextMetadata);
	if (!normalizedMetadata) {
		return {
			ok: false,
			status: 'invalid_metadata',
			message: 'metadata must include name(string), detail(string), isUsed(boolean).'
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
		const normalizedMosaicIdHex = normalizeMosaicIdHex(mosaicIdHex);
		const mosaicId = BigInt(`0x${normalizedMosaicIdHex}`);
		const metadataKey = metadataGenerateKey(metadataKeySeed);
		const account = generateAccountFromPrivateKey(facade, privateKey);

		const mosaicWithMetadata = await getMosaicWithMetadata(nodeUrl, normalizedMosaicIdHex);
		const oldValueBytes = extractExistingMetadataValueBytes(
			mosaicWithMetadata.metadataEntries as ReadonlyArray<Record<string, unknown>>,
			metadataKey
		);
		if (!oldValueBytes) {
			return {
				ok: false,
				status: 'metadata_not_found',
				message: 'metadata entry was not found for the given metadataKeySeed.'
			};
		}

		const newValueBytes = new TextEncoder().encode(JSON.stringify(normalizedMetadata));
		const value = metadataUpdateValue(oldValueBytes, newValueBytes);
		const valueSizeDelta = newValueBytes.length - oldValueBytes.length;

		const embeddedMetadata = facade.transactionFactory.createEmbedded({
			type: 'mosaic_metadata_transaction_v1',
			signerPublicKey: account.publicKey,
			targetAddress: account.address,
			scopedMetadataKey: metadataKey,
			targetMosaicId: new models.UnresolvedMosaicId(mosaicId),
			valueSizeDelta,
			value
		});

		const { transaction } = createAggregateTransaction(
			facade,
			account,
			{
				aggregateType,
				deadlineHours,
				embeddedTransactions: [embeddedMetadata],
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
				mosaicIdHex: `0x${normalizedMosaicIdHex}`
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
