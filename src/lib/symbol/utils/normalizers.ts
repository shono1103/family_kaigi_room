export const normalizeMosaicIdHex = (mosaicIdHex: string): string =>
	mosaicIdHex.trim().replace(/^0x/i, "").toUpperCase();


const SYMBOL_PUBLIC_KEY_REGEX = /^[0-9A-F]{64}$/;

export function normalizeSymbolPublicKey(
	value: string | null | undefined,
): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim().toUpperCase();
	return SYMBOL_PUBLIC_KEY_REGEX.test(normalized) ? normalized : null;
}

export function isValidSymbolPublicKey(publicKey: string): boolean {
	return SYMBOL_PUBLIC_KEY_REGEX.test(publicKey.trim().toUpperCase());
}

export const toHexMosaicId = (mosaicId: bigint): string =>
	`0x${mosaicId.toString(16).toUpperCase().padStart(16, '0')}`;

export const toHexMetadataKey = (metadataKey: bigint): string =>
	`0x${metadataKey.toString(16).toUpperCase().padStart(16, '0')}`;
