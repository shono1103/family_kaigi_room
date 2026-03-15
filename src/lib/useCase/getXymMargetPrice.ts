const XYM_MARKET_PRICE_ENDPOINT =
	"https://api.coingecko.com/api/v3/simple/price?ids=symbol&vs_currencies=jpy,usd";

type GetXymMargetPriceSuccess = Readonly<{
	ok: true;
	status: "ok";
	jpy: number;
	usd: number | null;
}>;

type GetXymMargetPriceFailure = Readonly<{
	ok: false;
	status: "fetch_failed" | "invalid_response";
	message: string;
}>;

export type GetXymMargetPriceResult = Readonly<
	GetXymMargetPriceSuccess | GetXymMargetPriceFailure
>;

type CoinGeckoSimplePriceResponse = Readonly<{
	symbol?: Readonly<{
		jpy?: unknown;
		usd?: unknown;
	}>;
}>;

const isFiniteNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

export async function getXymMargetPrice(): Promise<GetXymMargetPriceResult> {
	try {
		const response = await fetch(XYM_MARKET_PRICE_ENDPOINT, {
			method: "GET",
			headers: {
				accept: "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return {
				ok: false,
				status: "fetch_failed",
				message: `CoinGecko request failed with status ${response.status}`,
			};
		}

		const data = (await response.json()) as CoinGeckoSimplePriceResponse;
		const jpy = data.symbol?.jpy;
		const usd = data.symbol?.usd;

		if (!isFiniteNumber(jpy)) {
			return {
				ok: false,
				status: "invalid_response",
				message: "CoinGecko response does not include symbol.jpy",
			};
		}

		return {
			ok: true,
			status: "ok",
			jpy,
			usd: isFiniteNumber(usd) ? usd : null,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			status: "fetch_failed",
			message,
		};
	}
}
