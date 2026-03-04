import {
	fetchWithTimeout,
	getSymbolNodeUrlList,
	isValidSymbolPublicKey,
	normalizeSymbolPublicKey,
} from "./utils";

const SYMBOL_REQUEST_TIMEOUT_MS = 6000;
const MAX_TARGET_MOSAICS = 50;

type OwnedTicketsStatus =
	| "ok"
	| "missing_public_key"
	| "invalid_public_key"
	| "account_not_found"
	| "node_unreachable";

export type OwnedTicketItem = {
	mosaicId: string;
	amountRaw: string;
	name: string;
	detail: string;
	isUsed: boolean;
	metadataEntries: string[];
	thumbnail: {
		filename: string;
		mimeType: string;
		size: number;
		sha256: string;
	} | null;
};

export type OwnedTicketsResult =
	| {
			status: "ok";
			tickets: OwnedTicketItem[];
	  }
	| {
			status: Exclude<OwnedTicketsStatus, "ok">;
			tickets: [];
	  };

type SymbolAccountResponse = {
	account?: {
		mosaics?: Array<{
			id?: string;
			amount?: string;
		}>;
	};
};

type SymbolMetadataPageResponse = {
	data?: Array<{
		metadataEntry?: {
			value?: string;
		};
	}>;
};

type TicketMetadataPayload = {
	name: string;
	detail: string;
	isUsed: boolean;
	thumbnail?: {
		filename?: string;
		mimeType?: string;
		size?: number;
		sha256?: string;
	};
};

function normalizeMosaicId(mosaicId: string | undefined | null) {
	if (!mosaicId) {
		return null;
	}

	const normalized = mosaicId.trim().replace(/^0x/i, "").toUpperCase();
	return /^[0-9A-F]{16}$/.test(normalized) ? normalized : null;
}

function toFallbackTicketItem(
	mosaicId: string,
	amountRaw: string,
	metadataEntries: string[] = [],
): OwnedTicketItem {
	return {
		mosaicId,
		amountRaw,
		name: "未分類モザイク",
		detail: "チケットメタデータ未設定",
		isUsed: false,
		metadataEntries,
		thumbnail: null,
	};
}

function decodeMetadataValue(value: string) {
	const trimmed = value.trim();
	if (trimmed.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(trimmed)) {
		try {
			return Buffer.from(trimmed, "hex").toString("utf-8");
		} catch {
			return trimmed;
		}
	}

	return trimmed;
}

function toTicketFromMetadata(
	mosaicId: string,
	amountRaw: string,
	metadata: TicketMetadataPayload,
	metadataEntries: string[],
): OwnedTicketItem | null {
	if (!metadata || typeof metadata !== "object") {
		return null;
	}

	if (
		typeof metadata.name !== "string" ||
		typeof metadata.detail !== "string" ||
		typeof metadata.isUsed !== "boolean"
	) {
		return null;
	}

	const name = metadata.name.trim();
	const detail = metadata.detail.trim();
	if (!name || !detail) {
		return null;
	}

	const thumbnail = metadata.thumbnail;
	const normalizedThumbnail =
		thumbnail &&
		typeof thumbnail.filename === "string" &&
		typeof thumbnail.mimeType === "string" &&
		typeof thumbnail.size === "number" &&
		typeof thumbnail.sha256 === "string"
			? {
					filename: thumbnail.filename,
					mimeType: thumbnail.mimeType,
					size: thumbnail.size,
					sha256: thumbnail.sha256,
				}
			: null;

	return {
		mosaicId,
		amountRaw,
		name,
		detail,
		isUsed: metadata.isUsed,
		metadataEntries,
		thumbnail: normalizedThumbnail,
	};
}

async function fetchTicketFromMosaic(
	nodeUrl: string,
	mosaicId: string,
	amountRaw: string,
): Promise<OwnedTicketItem> {
	try {
		const response = await fetchWithTimeout(
			`${nodeUrl.replace(/\/$/, "")}/metadata?targetId=${mosaicId}&metadataType=1&pageSize=100`,
			SYMBOL_REQUEST_TIMEOUT_MS,
		);
		if (!response.ok) {
			return toFallbackTicketItem(mosaicId, amountRaw);
		}

		const metadataPage = (await response.json()) as SymbolMetadataPageResponse;
		const decodedMetadataEntries: string[] = [];
		for (const metadataInfo of metadataPage.data ?? []) {
			const rawValue = metadataInfo.metadataEntry?.value;
			if (typeof rawValue !== "string" || !rawValue.trim()) {
				continue;
			}
			const decoded = decodeMetadataValue(rawValue);
			decodedMetadataEntries.push(decoded);

			try {
				const parsed = JSON.parse(decoded) as TicketMetadataPayload;
				const ticket = toTicketFromMetadata(
					mosaicId,
					amountRaw,
					parsed,
					decodedMetadataEntries,
				);
				if (ticket) {
					return ticket;
				}
			} catch {
				// skip non JSON metadata
			}
		}

		return toFallbackTicketItem(mosaicId, amountRaw, decodedMetadataEntries);
	} catch {
		return toFallbackTicketItem(mosaicId, amountRaw);
	}
}

export async function getOwnedTicketsByPublicKey(
	inputPublicKey: string | null | undefined,
): Promise<OwnedTicketsResult> {
	const normalizedPublicKey = normalizeSymbolPublicKey(inputPublicKey);
	if (!normalizedPublicKey) {
		return { status: "missing_public_key", tickets: [] };
	}

	if (!isValidSymbolPublicKey(normalizedPublicKey)) {
		return { status: "invalid_public_key", tickets: [] };
	}

	const nodeUrlList = getSymbolNodeUrlList();
	if (!nodeUrlList.length) {
		return { status: "node_unreachable", tickets: [] };
	}

	for (const nodeUrl of nodeUrlList) {
		try {
			const accountResponse = await fetchWithTimeout(
				`${nodeUrl.replace(/\/$/, "")}/accounts/${normalizedPublicKey}`,
				SYMBOL_REQUEST_TIMEOUT_MS,
			);

			if (accountResponse.status === 404) {
				return { status: "account_not_found", tickets: [] };
			}

			if (!accountResponse.ok) {
				continue;
			}

			const accountData = (await accountResponse.json()) as SymbolAccountResponse;
			const accountMosaics = accountData.account?.mosaics ?? [];
			const targetMosaics = accountMosaics
				.map((mosaic) => {
					const mosaicId = normalizeMosaicId(mosaic.id);
					const amountRaw = mosaic.amount?.trim() ?? "0";
					if (!mosaicId) {
						return null;
					}
					return { mosaicId, amountRaw };
				})
				.filter((item): item is { mosaicId: string; amountRaw: string } => Boolean(item))
				.slice(0, MAX_TARGET_MOSAICS);

			if (!targetMosaics.length) {
				return { status: "ok", tickets: [] };
			}

			const ticketCandidates = await Promise.all(
				targetMosaics.map((mosaic) =>
					fetchTicketFromMosaic(nodeUrl, mosaic.mosaicId, mosaic.amountRaw),
				),
			);
			const tickets = ticketCandidates;

			return { status: "ok", tickets };
		} catch {
			// try next node
		}
	}

	return { status: "node_unreachable", tickets: [] };
}
