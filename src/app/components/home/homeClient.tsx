"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { FamilyCurrencyPanel } from "./mainPanel/familyCurrencyPanel";
import { QuestPanel } from "./mainPanel/questPanel";
import { BaseInfoPanel } from "./mainPanel/baseInfoPanel";
import type { OwnedTicketsResult } from "@/lib/symbol/useCase/ticket/result";
import type { ReadAccountOwnedMosaicsResult } from "@/lib/symbol/useCase/account/read";
import type { GetCurrencyDetailsResult } from "@/lib/symbol/useCase/currency/read";

const tabs = [
	{ label: "クエスト", key: "tickets" },
	{ label: "スコア", key: "balance" },
	{ label: "設定", key: "base-info" },
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
	familyName: string | null;
	userInfo: {
		name: string;
		symbolPubKey: string | null;
	} | null;
	familyCurrency: GetCurrencyDetailsResult;
	ownedMosaics?: ReadAccountOwnedMosaicsResult;
	ownedTickets: OwnedTicketsResult;
	initialTab?: string;
};

export function HomeClient({
	userEmail,
	familyName,
	userInfo,
	familyCurrency,
	ownedMosaics: _ownedMosaics,
	ownedTickets: _ownedTickets,
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
		<div className="min-h-screen bg-[linear-gradient(180deg,#f4f5f8,#eceff4)] text-[#1e1e2a] lg:h-screen lg:overflow-hidden">
			<div className="flex min-h-screen flex-col px-3 py-3 md:px-4 md:py-4 lg:h-full lg:min-h-0">
				<Header userEmail={userEmail} userName={userInfo?.name} />

				<div className="mt-3 grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
					<Sidebar
						tabs={tabs}
						activeIndex={activeIndex}
						onTabClick={handleTabClick}
					/>
					<main className="rounded-[32px] border border-black/10 bg-white/92 shadow-[0_18px_55px_rgba(20,15,45,0.08)] backdrop-blur lg:min-h-0 lg:overflow-hidden">
						<div className="px-6 py-6 md:px-8 md:py-8 lg:h-full lg:overflow-y-auto lg:overscroll-contain">
							<QuestPanel isActive={activeIndex === 0} index={0} />
							<FamilyCurrencyPanel
								isActive={activeIndex === 1}
								index={1}
								familyName={familyName}
								familyCurrency={familyCurrency}
							/>
							<BaseInfoPanel
								isActive={activeIndex === 2}
								index={2}
								userEmail={userEmail}
								userInfo={userInfo}
							/>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
