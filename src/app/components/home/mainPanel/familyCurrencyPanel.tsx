import type { GetCurrencyDetailsResult } from "@/lib/symbol/useCase/currency/read";

type FamilyCurrencyPanelProps = {
	isActive: boolean;
	index: number;
	familyName: string | null;
	familyCurrency: GetCurrencyDetailsResult;
};

function getStatusMessage(familyCurrency: GetCurrencyDetailsResult) {
	if (familyCurrency.ok) {
		return null;
	}

	switch (familyCurrency.status) {
		case "invalid_public_key":
			return "家族のSymbol公開鍵が未設定または不正です。設定を確認してください。";
		case "invalid_mosaic_id":
			return "家族通貨のMosaic IDが不正です。";
		case "account_not_found":
			return "家族のSymbolアカウントが見つかりません。";
		case "invalid_currency_metadata":
			return "家族通貨のメタデータを読み取れませんでした。";
		case "node_unreachable":
			return "Symbolノードへ接続できませんでした。時間をおいて再試行してください。";
		default:
			return "家族通貨の読み取りに失敗しました。時間をおいて再試行してください。";
	}
}

export function FamilyCurrencyPanel({
	isActive,
	index,
	familyName,
	familyCurrency,
}: FamilyCurrencyPanelProps) {
	const statusMessage = getStatusMessage(familyCurrency);

	return (
		<section
			id={`panel-${index}`}
			role="tabpanel"
			aria-labelledby={`tab-${index}`}
			aria-hidden={!isActive}
			className={[
				"min-h-[60svh] origin-top transition duration-150 ease-out",
				isActive
					? "block translate-y-0 scale-100 opacity-100"
					: "hidden translate-y-2 scale-[0.98] opacity-0",
			].join(" ")}
		>
			<h2 className="mt-0 text-2xl font-semibold">スコア</h2>
			{familyCurrency.ok ? (
				<div className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
					<div className="rounded-xl border border-black/10 bg-white/70 p-3">
						<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4b4b65]">
							Family Currency
						</p>
						<p className="mt-1 text-2xl font-extrabold text-[#202033]">
							{familyCurrency.amountRaw}
						</p>
					</div>
					<div className="rounded-xl border border-black/10 bg-white/70 p-3">
						<p className="text-xs font-bold text-[#4b4b65]">
							{familyName ?? "家族"}の通貨
						</p>
						<p className="mt-1 text-lg font-bold text-[#202033]">
							{familyCurrency.currencyMetadata.name}
						</p>
						<p className="mt-2 text-sm text-[#4b4b65]">
							{familyCurrency.currencyMetadata.detail}
						</p>
					</div>
					<p className="text-xs font-semibold text-[#4b4b65]">
						Mosaic ID: {familyCurrency.mosaicIdHex}
					</p>
				</div>
			) : (
				<div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
					<p className="text-sm font-semibold text-[#4b4b65]">
						{statusMessage}
					</p>
				</div>
			)}
		</section>
	);
}
