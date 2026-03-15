"use client";

import { XymMarketPriceCard } from "./XymMarketPriceCard";
import type { AllowancePanelProps } from "./types";

export function AllowancePanel({
	isActive,
	index,
	xymMarketPriceJpy,
}: AllowancePanelProps) {
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
			<h2 className="mt-0 text-2xl font-semibold">お小遣い</h2>
			<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
				このパネルはダミーです。将来的にお小遣いの付与や履歴確認を配置します。
			</p>

			<div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
				<XymMarketPriceCard xymMarketPriceJpy={xymMarketPriceJpy} />

				<div className="rounded-3xl border border-dashed border-black/15 bg-[linear-gradient(180deg,#ffffff,#f6f7fb)] p-6">
					<p className="text-lg font-bold text-[#202033]">お小遣いパネル準備中</p>
					<p className="mt-3 text-sm leading-6 text-[#4b4b65]">
						ここに付与予定額、直近の配布履歴、月次サマリーなどを表示する想定です。
					</p>
				</div>
			</div>
		</section>
	);
}
