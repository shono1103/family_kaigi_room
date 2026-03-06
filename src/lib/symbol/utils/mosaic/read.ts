// /mosaics/{id} のレスポンスを受けるための最小DTO。
type SymbolMosaicDto = Readonly<Record<string, unknown>>;

// metadataEntry 本体の形は用途ごとに拡張する前提で汎用DTOにしている。
type SymbolMetadataEntryDto = Readonly<Record<string, unknown>>;

// /metadata の data 配列1要素。metadataEntry が内包されるケースに対応。
type SymbolMetadataItemDto = Readonly<{
	metadataEntry?: SymbolMetadataEntryDto;
	[key: string]: unknown;
}>;

// /metadata エンドポイントのレスポンスDTO。
type SymbolMetadataResponseDto = Readonly<{
	data?: SymbolMetadataItemDto[];
}>;

// getMosaicWithMetadata が呼び出し側へ返す整形済みデータ。
export type GetMosaicWithMetadataResult = Readonly<{
	mosaic: SymbolMosaicDto;
	metadataEntries: SymbolMetadataEntryDto[];
}>;

const fetchJson = async (
	url: string
): Promise<unknown> => {
	let res: Response;
	try {
		res = await fetch(url);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Network request failed: ${url} (${message})`);
	}

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Request failed (${res.status}) ${url}: ${text}`);
	}

	return res.json();
};

const normalizeMosaicIdHex = (mosaicIdHex: string): string =>
	mosaicIdHex.trim().replace(/^0x/i, "").toUpperCase();

/**
 * モザイク本体情報と紐づくメタデータ一覧を取得します。
 */
export const getMosaicWithMetadata = async (
	nodeUrl: string,
	mosaicIdHex: string
): Promise<GetMosaicWithMetadataResult> => {
	const normalizedMosaicIdHex = normalizeMosaicIdHex(mosaicIdHex);
	const mosaicResponse = await fetchJson(`${nodeUrl}/mosaics/${normalizedMosaicIdHex}`) as SymbolMosaicDto;

	const metadataQuery = new URLSearchParams({
		targetId: normalizedMosaicIdHex,
		metadataType: '1',
		pageSize: '100'
	});
	const metadataResponse = await fetchJson(`${nodeUrl}/metadata?${metadataQuery.toString()}`) as SymbolMetadataResponseDto;
	const metadataEntries = (metadataResponse.data ?? []).map(
		(item: SymbolMetadataItemDto): SymbolMetadataEntryDto => item.metadataEntry ?? item
	);

	return {
		mosaic: mosaicResponse,
		metadataEntries
	};
};
