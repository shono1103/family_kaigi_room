"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Header } from "./header";
import { BalancePanel } from "./balancePanel";
import { OwnTicketPanel } from "./ownTicketPanel";
import { BaseInfoPanel } from "./baseInfoPanel";

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
	initialTab?: string;
};

export function HomeClient({ userEmail, userInfo, initialTab }: HomeClientProps) {
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
		<div className="min-h-screen bg-[radial-gradient(900px_600px_at_15%_15%,rgba(255,79,163,0.18),transparent_60%),radial-gradient(900px_600px_at_85%_25%,rgba(124,92,255,0.18),transparent_60%),linear-gradient(180deg,#fff4fb,#f2fbff)] bg-fixed bg-cover text-[#1e1e2a]">
			<div className="mx-auto my-10 max-w-[900px] px-4 pb-20">
				<Header
					tabs={tabs}
					activeIndex={activeIndex}
					onTabClick={handleTabClick}
				/>
				<main className="mt-6 rounded-[28px] bg-white/90 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.18)]">
					<OwnTicketPanel isActive={activeIndex === 0} index={0} />
					<BalancePanel isActive={activeIndex === 1} index={1} />
					<BaseInfoPanel
						isActive={activeIndex === 2}
						index={2}
						userEmail={userEmail}
						userInfo={userInfo}
					/>
				</main>
			</div>
		</div>
	);
}
