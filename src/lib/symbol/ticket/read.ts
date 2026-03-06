import { nodeUrl } from '../config'
import { getMosaicWithMetadata, type GetMosaicWithMetadataResult } from '../utils/mosaic'
import type { TicketMetadata, TicketMetadataThumbnail } from './types';

export type GetTicketDetailsResult = GetMosaicWithMetadataResult & Readonly<{
	ticketMetadata: TicketMetadata;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	'object' === typeof value && null !== value;

const isTicketMetadataThumbnail = (value: unknown): value is TicketMetadataThumbnail => {
	if (!isRecord(value)) {
		return false;
	}
	return (
		'string' === typeof value.filename &&
		'string' === typeof value.mimeType &&
		'number' === typeof value.size &&
		Number.isFinite(value.size) &&
		'string' === typeof value.sha256
	);
};

const isTicketMetadata = (value: unknown): value is TicketMetadata => {
	if (!isRecord(value)) {
		return false;
	}
	const thumbnail = value.thumbnail;
	return (
		'string' === typeof value.name &&
		'string' === typeof value.detail &&
		'boolean' === typeof value.isUsed &&
		(undefined === thumbnail || isTicketMetadataThumbnail(thumbnail))
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

const extractTicketMetadata = (source: GetMosaicWithMetadataResult): TicketMetadata => {
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
			if (isTicketMetadata(parsed)) {
				return parsed;
			}
		}
	}

	throw new Error('Ticket metadata validation failed: required keys (name, detail, isUsed) were not found.');
};

export const getTicketDetails = async (
	mosaicIdHex: string
): Promise<GetTicketDetailsResult> => {
	const mosaicWithMetadata = await getMosaicWithMetadata(nodeUrl, mosaicIdHex);
	const ticketMetadata = extractTicketMetadata(mosaicWithMetadata);
	return {
		...mosaicWithMetadata,
		ticketMetadata
	};
};
