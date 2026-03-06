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

export async function fetchWithTimeout(
	url: string,
	timeoutMs: number,
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => {
		controller.abort();
	}, timeoutMs);

	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timeoutId);
	}
}
