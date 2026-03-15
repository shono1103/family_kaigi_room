"use client";

import { MonthlyAllowanceCard } from "./MonthlyAllowanceCard";
import type { AllowancePanelProps } from "./types";
export function AllowancePanel({
	isActive,
	index,
	userVoiceAmountRaw,
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

			<div className="mt-6">
				<MonthlyAllowanceCard
					userVoiceAmountRaw={userVoiceAmountRaw}
					xymMarketPriceJpy={xymMarketPriceJpy}
				/>
			</div>
		</section>
	);
}
