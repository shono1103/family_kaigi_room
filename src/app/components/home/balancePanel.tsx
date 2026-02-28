import type { XymBalanceResult } from "@/lib/symbol/balance";

type BalancePanelProps = {
	isActive: boolean;
	index: number;
	xymBalance: XymBalanceResult;
};

export function BalancePanel({ isActive, index, xymBalance }: BalancePanelProps) {
	const statusMessage = (() => {
		if (xymBalance.status === "missing_public_key") {
			return "公開鍵が未設定です。基本情報から設定してください。";
		}
		if (xymBalance.status === "invalid_public_key") {
			return "公開鍵の形式が不正です。基本情報で修正してください。";
		}
		if (xymBalance.status === "account_not_found") {
			return "指定された公開鍵のSymbolアカウントが見つかりません。";
		}
		if (xymBalance.status === "node_unreachable") {
			return "Symbolノードへ接続できませんでした。時間をおいて再試行してください。";
		}
		return null;
	})();

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
			<h2 className="mt-0 text-2xl font-semibold">残高</h2>
			{ xymBalance.status === "ok" ? (
				<div className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
					<div className="rounded-xl border border-black/10 bg-white/70 p-3">
						<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4b4b65]">
							XYM Balance
						</p>
						<p className="mt-1 text-2xl font-extrabold text-[#202033]">
							{xymBalance.balance.amountDisplay} XYM
						</p>
					</div>
					<p className="text-xs font-semibold text-[#4b4b65]">
						Raw: {xymBalance.balance.amountRaw}
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
