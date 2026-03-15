"use client";

type XymMarketPriceCardProps = {
	xymMarketPriceJpy: number | null;
};

function formatJpyPrice(value: number) {
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
		maximumFractionDigits: 2,
	}).format(value);
}

export function XymMarketPriceCard({
	xymMarketPriceJpy,
}: XymMarketPriceCardProps) {
	return (
		<div className="rounded-3xl border border-black/10 bg-[linear-gradient(180deg,#fff7ea,#fffdf8)] p-6 shadow-[0_10px_28px_rgba(20,15,45,0.06)]">
			<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b6b2f]">
				XYM Market Price
			</p>
			<p className="mt-3 text-3xl font-extrabold text-[#202033]">
				{xymMarketPriceJpy !== null ? formatJpyPrice(xymMarketPriceJpy) : "--"}
			</p>
			<p className="mt-3 text-sm leading-6 text-[#5f533f]">
				{xymMarketPriceJpy !== null
					? "CoinGecko から取得した 1 XYM あたりの日本円相場です。"
					: "XYM 相場を取得できませんでした。時間をおいて再表示してください。"}
			</p>
		</div>
	);
}
