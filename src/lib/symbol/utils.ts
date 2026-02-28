const PUBLIC_KEY_REGEX = /^[0-9A-F]{64}$/;

export function normalizeSymbolPublicKey(value: string | null | undefined) {
	return (value ?? "").trim().toUpperCase() || null;
}

export function isValidSymbolPublicKey(publicKey: string) {
	return PUBLIC_KEY_REGEX.test(publicKey);
}

export function getSymbolNodeUrlList() {
	const network = process.env.SYMBOL_NETWORK;
	const list =
		network === "mainnet"
			? process.env.SYMBOL_MAINNET_NODE_URL_LIST
			: process.env.SYMBOL_TESTNET_NODE_URL_LIST;

	return (list ?? "")
		.split(",")
		.map((url) => url.trim())
		.filter(Boolean);
}

export async function fetchWithTimeout(
	url: string,
	timeoutMs: number,
	signal?: AbortSignal,
) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const combinedSignal = signal
		? AbortSignal.any([signal, controller.signal])
		: controller.signal;

	try {
		return await fetch(url, {
			method: "GET",
			cache: "no-store",
			signal: combinedSignal,
		});
	} finally {
		clearTimeout(timeoutId);
	}
}
