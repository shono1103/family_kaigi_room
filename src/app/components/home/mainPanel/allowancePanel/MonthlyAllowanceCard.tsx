"use client";

type MonthlyAllowanceCardProps = {
	userVoiceAmountRaw: string;
	xymMarketPriceJpy: number | null;
};

function formatJpyPrice(value: number) {
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
		minimumFractionDigits: 3,
		maximumFractionDigits: 3,
	}).format(value);
}

function formatRoundedJpyPrice(value: number) {
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
		maximumFractionDigits: 0,
	}).format(Math.round(value));
}

function toVoiceAmount(value: string) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function XymMarketPriceCard({
	xymMarketPriceJpy,
}: {
	xymMarketPriceJpy: number | null;
}) {
	return (
		<div className="rounded-2xl border border-black/10 bg-[linear-gradient(180deg,#fff7ea,#fffdf8)] p-4 shadow-[0_10px_28px_rgba(20,15,45,0.05)]">
			<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b6b2f]">
				XYM Market Price
			</p>
			<p className="mt-2 text-2xl font-extrabold text-[#202033]">
				{xymMarketPriceJpy !== null ? formatJpyPrice(xymMarketPriceJpy) : "--"}
			</p>
		</div>
	);
}

export function MonthlyAllowanceCard({
	userVoiceAmountRaw,
	xymMarketPriceJpy,
}: MonthlyAllowanceCardProps) {
	const voiceAmount = toVoiceAmount(userVoiceAmountRaw);
	const monthlyAllowance =
		xymMarketPriceJpy !== null ? voiceAmount * xymMarketPriceJpy : null;

	return (
		<div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#edf8ff_0%,#f7fbff_55%,#eef4ff_100%)] p-6 pb-[220px] shadow-[0_18px_45px_rgba(20,15,45,0.08)] md:p-8 md:pb-8 md:pr-[360px]">
			<div className="pointer-events-none absolute inset-y-0 right-[28%] w-px bg-black/6" />
			<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#2d6f8a]">
				Monthly Allowance
			</p>
			<p className="mt-6 text-[4.5rem] leading-[0.9] font-extrabold text-[#202033]">
				{monthlyAllowance !== null ? formatRoundedJpyPrice(monthlyAllowance) : "--"}
			</p>
			<div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#58707e]">
				<span className="rounded-full bg-white/80 px-3 py-2 shadow-[0_6px_18px_rgba(20,15,45,0.06)]">
					所持 Voice: {voiceAmount}
				</span>
				<span className="rounded-full bg-white/80 px-3 py-2 shadow-[0_6px_18px_rgba(20,15,45,0.06)]">
					計算式: {voiceAmount} × {xymMarketPriceJpy ?? "--"}
				</span>
			</div>
			<div className="absolute right-6 bottom-6 w-[calc(100%-3rem)] max-w-[320px] md:right-8 md:bottom-8 md:w-[320px]">
				<XymMarketPriceCard xymMarketPriceJpy={xymMarketPriceJpy} />
			</div>
		</div>
	);
}
