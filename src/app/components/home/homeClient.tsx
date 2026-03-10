"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Header } from "./header";
import { BalancePanel } from "./mainPanel/balancePanel";
import { OwnTicketPanel } from "./mainPanel/ownTicketPanel";
import { BaseInfoPanel } from "./mainPanel/baseInfoPanel";
import type { ReadXymBalanceResult } from "@/lib/symbol/useCase/xymBalance/read";
import type { OwnedTicketsResult } from "@/lib/symbol/useCase/ticket/result";
import type { ReadAccountOwnedMosaicsResult } from "@/lib/symbol/useCase/account/read";

const tabs = [
	{ label: "保有チケット", key: "tickets" },
	{ label: "残高", key: "balance" },
	{ label: "基本情報", key: "base-info" },
] as const;

type HomeTabKey = (typeof tabs)[number]["key"];
const HOME_TAB_KEY_SET = new Set<HomeTabKey>(tabs.map((tab) => tab.key));

function toTabIndex(tab: string | null | undefined) {
	if (!tab || !HOME_TAB_KEY_SET.has(tab as HomeTabKey)) {
		return 0;
	}

	return tabs.findIndex((item) => item.key === tab);
}

type HomeClientProps = {
	userEmail: string;
	userInfo: {
		name: string;
		symbolPubKey: string | null;
	} | null;
	xymBalance: ReadXymBalanceResult;
	ownedMosaics?: ReadAccountOwnedMosaicsResult;
	ownedTickets: OwnedTicketsResult;
	initialTab?: string;
};

export function HomeClient({
	userEmail,
	userInfo,
	xymBalance,
	ownedMosaics: _ownedMosaics,
	ownedTickets,
	initialTab,
}: HomeClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const initialActiveIndex = useMemo(() => toTabIndex(initialTab), [initialTab]);
	const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

	useEffect(() => {
		setActiveIndex(toTabIndex(searchParams.get("tab")));
	}, [searchParams]);

	const handleTabClick = (index: number) => {
		setActiveIndex(index);

		const tab = tabs[index]?.key ?? tabs[0].key;
		const nextSearchParams = new URLSearchParams(searchParams.toString());
		nextSearchParams.set("tab", tab);
		const nextQuery = nextSearchParams.toString();
		const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
		router.replace(nextUrl);
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f4f5f8,#eceff4)] text-[#1e1e2a]">
			<div className="flex min-h-screen flex-col px-3 py-3 md:px-4 md:py-4">
				<header className="rounded-[28px] border border-black/10 bg-white/92 px-5 py-4 shadow-[0_18px_55px_rgba(20,15,45,0.08)] backdrop-blur md:px-6">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex items-center gap-4">
							<div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1e1e2a] text-lg font-black text-white">
								★
							</div>
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#4b4b65]">
									shono&apos;s projects
								</p>
								<h1 className="mt-1 text-[20px] font-semibold">
									ほげほげチケットぷらっとふぉーむ
								</h1>
							</div>
						</div>
						<div className="rounded-2xl border border-black/10 bg-[#f7f7fa] px-4 py-3 text-sm text-[#4b4b65]">
							操作したい項目を左のサイドバーから選択してください。
						</div>
					</div>
				</header>

				<div className="mt-3 grid flex-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
					<Header
						tabs={tabs}
						activeIndex={activeIndex}
						onTabClick={handleTabClick}
					/>
					<main className="min-h-[calc(100svh-120px)] rounded-[32px] border border-black/10 bg-white/92 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.08)] backdrop-blur md:p-8">
						<OwnTicketPanel
							isActive={activeIndex === 0}
							index={0}
							ownedTickets={ownedTickets}
						/>
						<BalancePanel
							isActive={activeIndex === 1}
							index={1}
							xymBalance={xymBalance}
						/>
						<BaseInfoPanel
							isActive={activeIndex === 2}
							index={2}
							userEmail={userEmail}
							userInfo={userInfo}
						/>
					</main>
				</div>
			</div>
		</div>
	);
}
