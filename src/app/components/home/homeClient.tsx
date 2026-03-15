"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { FamilyCurrencyPanel } from "./mainPanel/familyCurrencyPanel";
import { FamilyMembersPanel } from "./mainPanel/familyMembersPanel";
import { FamilyUserPanel } from "./mainPanel/familyUserPanel";
import { QuestPanel } from "./mainPanel/questPanel";
import { BaseInfoPanel } from "./mainPanel/baseInfoPanel";
import type { OwnedTicketsResult } from "@/lib/symbol/useCase/ticket/result";
import type { ReadAccountOwnedMosaicsResult } from "@/lib/symbol/useCase/account/read";
import type { GetCurrencyDetailsResult } from "@/lib/symbol/useCase/currency/read";

type HomeTab = Readonly<{
	label: string;
	key: string;
}>;

function buildTabs(isFamilyOwner: boolean): HomeTab[] {
	return [
		{ label: "クエスト", key: "tickets" },
		{ label: "スコア", key: "balance" },
		{ label: "メンバー", key: "members" },
		...(isFamilyOwner ? [{ label: "家族追加", key: "family-user" }] : []),
		{ label: "設定", key: "base-info" },
	];
}

function toTabIndex(tab: string | null | undefined, tabs: HomeTab[]) {
	if (!tab || !new Set(tabs.map((item) => item.key)).has(tab)) {
		return 0;
	}

	return tabs.findIndex((item) => item.key === tab);
}

type HomeClientProps = {
	userEmail: string;
	isFamilyOwner: boolean;
	familyName: string | null;
	userInfo: {
		name: string;
		symbolPubKey: string | null;
	} | null;
	familyCurrency: GetCurrencyDetailsResult;
	ownedMosaics?: ReadAccountOwnedMosaicsResult;
	ownedTickets: OwnedTicketsResult;
	issuedQuests: Array<{
		id: string;
		title: string;
		detail: string;
		isResolved: string;
		createdAt: Date;
		updatedAt: Date;
		targetUser: {
			id: string;
			email: string;
			name: string | null;
			familyRole: string | null;
		} | null;
	}>;
	questTargetUsers: Array<{
		id: string;
		label: string;
	}>;
	familyMembers: Array<{
		id: string;
		name: string;
		email: string;
		familyRole: string | null;
		isFamilyOwner: boolean;
		isFirst: boolean;
		isCurrentUser: boolean;
	}>;
	targetQuests: Array<{
		id: string;
		title: string;
		detail: string;
		isResolved: string;
		createdAt: Date;
		updatedAt: Date;
		issuerUser: {
			id: string;
			email: string;
			name: string | null;
			familyRole: string | null;
		} | null;
	}>;
	initialTab?: string;
};

export function HomeClient({
	userEmail,
	isFamilyOwner,
	familyName,
	userInfo,
	familyCurrency,
	ownedMosaics: _ownedMosaics,
	ownedTickets: _ownedTickets,
	issuedQuests,
	questTargetUsers,
	familyMembers,
	targetQuests,
	initialTab,
}: HomeClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tabs = useMemo(() => buildTabs(isFamilyOwner), [isFamilyOwner]);
	const initialActiveIndex = useMemo(
		() => toTabIndex(initialTab, tabs),
		[initialTab, tabs],
	);
	const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

	useEffect(() => {
		setActiveIndex(toTabIndex(searchParams.get("tab"), tabs));
	}, [searchParams, tabs]);

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
				<Header
					userEmail={userEmail}
					userName={userInfo?.name}
					familyName={familyName}
				/>

				<div className="mt-3 grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
					<Sidebar
						tabs={tabs}
						activeIndex={activeIndex}
						onTabClick={handleTabClick}
					/>
					<main className="rounded-[32px] border border-black/10 bg-white/92 shadow-[0_18px_55px_rgba(20,15,45,0.08)] backdrop-blur lg:min-h-0 lg:overflow-hidden">
						<div className="px-6 py-6 md:px-8 md:py-8 lg:h-full lg:overflow-y-auto lg:overscroll-contain">
							<QuestPanel
								isActive={activeIndex === 0}
								index={0}
								issuedQuests={issuedQuests}
								targetUsers={questTargetUsers}
								targetQuests={targetQuests}
							/>
							<FamilyCurrencyPanel
								isActive={activeIndex === 1}
								index={1}
								familyName={familyName}
								familyCurrency={familyCurrency}
							/>
							<FamilyMembersPanel
								isActive={activeIndex === 2}
								index={2}
								members={familyMembers}
							/>
							{isFamilyOwner ? (
								<FamilyUserPanel
									isActive={activeIndex === 3}
									index={3}
								/>
							) : null}
							<BaseInfoPanel
								isActive={activeIndex === (isFamilyOwner ? 4 : 3)}
								index={isFamilyOwner ? 4 : 3}
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
