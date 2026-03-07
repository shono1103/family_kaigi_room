import { metadataGenerateKey, metadataUpdateValue, models } from 'symbol-sdk/symbol';
import { generateAccountFromPrivateKey } from '../../utils/accounts';
import { createAggregateTransaction, createMosaicSupplyDecreaseTransaction } from '../../utils/transaction-builders';
import { pollTransactionState } from '../../utils/node-client';
import { aggregateType, deadlineHours, facade, feeMultiplier, nodeUrl } from '../../config';
import { getMosaicWithMetadata } from '../../utils/node-client';

type DeleteTicketResult =
	| { ok: true; status: 'ok'; mosaicIdHex: string }
	| { ok: false; status: 'metadata_not_found' | 'node_unreachable' | 'announce_failed' | 'timeout' | 'delete_failed'; message: string };

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
	'object' === typeof value && null !== value;

const extractCurrentSupply = (mosaic: Record<string, unknown>): bigint | null => {
	const directSupply = parseBigIntLike(mosaic.supply);
	if (null !== directSupply && directSupply >= 0n)
		return directSupply;

	if (isRecord(mosaic.mosaic)) {
		const nestedSupply = parseBigIntLike(mosaic.mosaic.supply);
		if (null !== nestedSupply && nestedSupply >= 0n)
			return nestedSupply;
	}

	return null;
};

export const deleteTicketOnChain = async (
	privateKey: string,
	metadataKeySeed: string,
	mosaicIdHex: string
): Promise<DeleteTicketResult> => {
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
		const currentSupply = extractCurrentSupply(
			mosaicWithMetadata.mosaic as Record<string, unknown>
		);
		if (!oldValueBytes) {
			return {
				ok: false,
				status: 'metadata_not_found',
				message: 'metadata entry was not found for the given metadataKeySeed.'
			};
		}
		if (null === currentSupply) {
			return {
				ok: false,
				status: 'delete_failed',
				message: 'failed to read current mosaic supply.'
			};
		}

		const newValueBytes = new Uint8Array(0);
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
		const embeddedTransactions = [embeddedMetadata];
		if (currentSupply > 0n) {
			const embeddedSupplyDecrease = createMosaicSupplyDecreaseTransaction(
				facade,
				account,
				{
					mosaicId,
					delta: currentSupply
				}
			);
			embeddedTransactions.push(embeddedSupplyDecrease);
		}

		const { transaction } = createAggregateTransaction(
			facade,
			account,
			{
				aggregateType,
				deadlineHours,
				embeddedTransactions,
				feeMultiplier
			}
		);

		const signature = account.signTransaction(transaction);
		const payloadJson = facade.transactionFactory.static.attachSignature(transaction, signature);
		const hash = facade.hashTransaction(transaction).toString();

		const announceRes = await fetch(`${nodeUrl}/transactions`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: payloadJson
		});

		const announceText = await announceRes.text();
		if (!announceRes.ok) {
			return {
				ok: false,
				status: 'announce_failed',
				message: `Announce failed (${announceRes.status}): ${announceText}`,
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
			status: 'delete_failed',
			message
		};
	}
};
