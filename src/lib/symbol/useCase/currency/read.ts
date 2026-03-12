import { getMosaicWithMetadata, type GetMosaicWithMetadataResult } from '../../utils/node-client';
import { normalizeMosaicIdHex, normalizeSymbolPublicKey } from '../../utils/normalizers';
import { readAccountOwnedMosaicsByPublicKey } from '../account/read';
import { nodeUrl } from '../../config';
import type { CurrencyMetadata } from './schema';

type CurrencyOwnershipStatus = 'owned' | 'not_owned';

type GetCurrencyDetailsSuccess = Readonly<{
	ok: true;
	status: 'ok';
	publicKey: string;
	mosaicIdHex: string;
	ownershipStatus: CurrencyOwnershipStatus;
	amountRaw: string;
	mosaic: GetMosaicWithMetadataResult['mosaic'];
	metadataEntries: GetMosaicWithMetadataResult['metadataEntries'];
	currencyMetadata: CurrencyMetadata;
}>;

type GetCurrencyDetailsFailure = Readonly<{
	ok: false;
	status:
		| 'invalid_public_key'
		| 'invalid_mosaic_id'
		| 'account_not_found'
		| 'invalid_currency_metadata'
		| 'node_unreachable'
		| 'read_failed';
	message: string;
}>;

export type GetCurrencyDetailsResult =
	| GetCurrencyDetailsSuccess
	| GetCurrencyDetailsFailure;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	'object' === typeof value && null !== value;

const isCurrencyMetadata = (value: unknown): value is CurrencyMetadata => {
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

const decodeHexString = (hex: string): string | null => {
	if (!/^[0-9A-Fa-f]+$/.test(hex) || 0 !== hex.length % 2) {
		return null;
	}

	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
	}

	return new TextDecoder().decode(bytes);
};

const parseJsonIfPossible = (text: string): unknown => {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
};

const extractCurrencyMetadata = (
	source: GetMosaicWithMetadataResult
): CurrencyMetadata => {
	for (const entry of source.metadataEntries) {
		if (!isRecord(entry) || 'string' !== typeof entry.value) {
			continue;
		}

		const candidates = [entry.value];
		const decoded = decodeHexString(entry.value);
		if (decoded) {
			candidates.push(decoded);
		}

		for (const candidate of candidates) {
			const parsed = parseJsonIfPossible(candidate);
			if (isCurrencyMetadata(parsed)) {
				return parsed;
			}
		}
	}

	throw new Error('Currency metadata validation failed: required keys (name, detail) were not found.');
};

export const getCurrencyDetailsByPublicKey = async (
	rawPublicKey: string,
	rawMosaicIdHex: string
): Promise<GetCurrencyDetailsResult> => {
	const publicKey = normalizeSymbolPublicKey(rawPublicKey);
	if (!publicKey) {
		return {
			ok: false,
			status: 'invalid_public_key',
			message: 'publicKey must be a 64-character hex string.'
		};
	}

	let mosaicIdHex: string;
	try {
		mosaicIdHex = normalizeMosaicIdHex(rawMosaicIdHex);
		if (!/^[0-9A-F]{16}$/.test(mosaicIdHex)) {
			throw new Error('invalid mosaic id');
		}
	} catch {
		return {
			ok: false,
			status: 'invalid_mosaic_id',
			message: 'mosaicIdHex must be a 16-character hex string with optional 0x prefix.'
		};
	}

	try {
		const ownedMosaicsResult = await readAccountOwnedMosaicsByPublicKey(publicKey);
		if (!ownedMosaicsResult.ok) {
			return {
				ok: false,
				status:
					ownedMosaicsResult.status === 'invalid_public_key'
						? 'invalid_public_key'
						: ownedMosaicsResult.status === 'account_not_found'
							? 'account_not_found'
							: ownedMosaicsResult.status === 'node_unreachable'
								? 'node_unreachable'
								: 'read_failed',
				message: ownedMosaicsResult.message
			};
		}

		const mosaicWithMetadata = await getMosaicWithMetadata(nodeUrl, mosaicIdHex);
		const currencyMetadata = extractCurrencyMetadata(mosaicWithMetadata);
		const ownedMosaic = ownedMosaicsResult.mosaics.find(
			(mosaic) => mosaic.mosaicIdHex === mosaicIdHex
		);

		return {
			ok: true,
			status: 'ok',
			publicKey,
			mosaicIdHex: `0x${mosaicIdHex}`,
			ownershipStatus: ownedMosaic ? 'owned' : 'not_owned',
			amountRaw: ownedMosaic?.amountRaw ?? '0',
			mosaic: mosaicWithMetadata.mosaic,
			metadataEntries: mosaicWithMetadata.metadataEntries,
			currencyMetadata
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const status = message.includes('Currency metadata validation failed')
			? 'invalid_currency_metadata'
			: message.includes('mainnet-node.invalid') || message.includes('testnet-node.invalid')
				? 'node_unreachable'
				: 'read_failed';
		return {
			ok: false,
			status,
			message
		};
	}
};
