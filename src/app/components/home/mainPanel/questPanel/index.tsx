"use client";

import { useState } from "react";
import { QuestIssueModal } from "./QuestIssueModal";
import type { QuestPanelProps } from "./types";
import { useQuestIssue } from "./useQuestIssue";

type QuestListTab = "issued" | "target";

function formatQuestDate(date: Date) {
	return new Intl.DateTimeFormat("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function QuestStatusBadge({ isResolved }: { isResolved: boolean }) {
	return (
		<span
			className={[
				"rounded-full px-3 py-1 text-xs font-bold",
				isResolved
					? "bg-emerald-100 text-emerald-800"
					: "bg-sky-100 text-sky-800",
			].join(" ")}
		>
			{isResolved ? "解決済み" : "進行中"}
		</span>
	);
}

export function QuestPanel({
	isActive,
	index,
	issuedQuests,
	targetQuests,
	targetUsers,
}: QuestPanelProps) {
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
	const [activeQuestTab, setActiveQuestTab] = useState<QuestListTab>("issued");
	const {
		isSubmitting,
		submitError,
		submitSuccess,
		clearMessages,
		submitQuestIssue,
	} = useQuestIssue();

	const openIssueModal = () => {
		clearMessages();
		setIsIssueModalOpen(true);
	};

	const closeIssueModal = () => {
		setIsIssueModalOpen(false);
	};

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
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="mt-0 text-2xl font-semibold">クエスト</h2>
					<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
						発行したクエストと、自分が対象のクエストを確認できます。
					</p>
				</div>
				<button
					type="button"
					onClick={openIssueModal}
					className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
					disabled={targetUsers.length === 0}
				>
					クエスト作成
				</button>
			</div>

			<div className="mt-6 inline-flex rounded-2xl border border-black/10 bg-black/[0.03] p-1">
				<button
					type="button"
					onClick={() => setActiveQuestTab("issued")}
					className={[
						"rounded-xl px-4 py-2 text-sm font-bold transition",
						activeQuestTab === "issued"
							? "bg-white text-[#1e1e2a] shadow-sm"
							: "text-[#5b5b75] hover:text-[#1e1e2a]",
					].join(" ")}
				>
					発行クエスト
				</button>
				<button
					type="button"
					onClick={() => setActiveQuestTab("target")}
					className={[
						"rounded-xl px-4 py-2 text-sm font-bold transition",
						activeQuestTab === "target"
							? "bg-white text-[#1e1e2a] shadow-sm"
							: "text-[#5b5b75] hover:text-[#1e1e2a]",
					].join(" ")}
				>
					対象クエスト
				</button>
			</div>

			{activeQuestTab === "issued" ? (
				<div className="mt-6 grid gap-4">
					{issuedQuests.length > 0 ? (
						issuedQuests.map((quest) => (
							<article
								key={quest.id}
								className="rounded-3xl border border-black/10 bg-[linear-gradient(180deg,#ffffff,#f6f7fb)] p-5 shadow-[0_10px_28px_rgba(20,15,45,0.06)]"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="text-lg font-bold text-[#202033]">
											{quest.title}
										</p>
										<p className="mt-2 text-sm font-semibold text-[#5b5b75]">
											対象: {quest.targetUser?.name ?? quest.targetUser?.email ?? "不明"}
										</p>
									</div>
									<QuestStatusBadge isResolved={quest.isResolved} />
								</div>
								<p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#3a3a52]">
									{quest.detail}
								</p>
								<div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6a6a84]">
									<span>
										作成: {formatQuestDate(new Date(quest.createdAt))}
									</span>
									{quest.targetUser?.familyRole ? (
										<span className="rounded-full bg-black/[0.05] px-3 py-1">
											Role: {quest.targetUser.familyRole}
										</span>
									) : null}
								</div>
							</article>
						))
					) : (
						<div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.03] p-6 text-sm font-semibold text-[#4b4b65]">
							{targetUsers.length > 0
								? "まだ発行したクエストはありません。"
								: "対象ユーザーがいないため、今はクエストを作成できません。"}
						</div>
					)}
				</div>
			) : (
				<div className="mt-6 grid gap-4">
					{targetQuests.length > 0 ? (
						targetQuests.map((quest) => (
							<article
								key={quest.id}
								className="rounded-3xl border border-black/10 bg-[linear-gradient(180deg,#ffffff,#f6f7fb)] p-5 shadow-[0_10px_28px_rgba(20,15,45,0.06)]"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="text-lg font-bold text-[#202033]">
											{quest.title}
										</p>
										<p className="mt-2 text-sm font-semibold text-[#5b5b75]">
											発行者: {quest.issuerUser?.name ?? quest.issuerUser?.email ?? "不明"}
										</p>
									</div>
									<QuestStatusBadge isResolved={quest.isResolved} />
								</div>
								<p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#3a3a52]">
									{quest.detail}
								</p>
								<div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6a6a84]">
									<span>
										作成: {formatQuestDate(new Date(quest.createdAt))}
									</span>
									{quest.issuerUser?.familyRole ? (
										<span className="rounded-full bg-black/[0.05] px-3 py-1">
											Role: {quest.issuerUser.familyRole}
										</span>
									) : null}
								</div>
							</article>
						))
					) : (
						<div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.03] p-6 text-sm font-semibold text-[#4b4b65]">
							自分が対象のクエストはまだありません。
						</div>
					)}
				</div>
			)}

			{submitSuccess ? (
				<p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
					{submitSuccess}
				</p>
			) : null}
			{submitError ? (
				<p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
					{submitError}
				</p>
			) : null}

			<QuestIssueModal
				isOpen={isIssueModalOpen}
				onClose={closeIssueModal}
				onSubmit={async (event) => {
					const isSuccess = await submitQuestIssue(event);
					if (isSuccess) {
						setIsIssueModalOpen(false);
					}
					return isSuccess;
				}}
				isSubmitting={isSubmitting}
				targetUsers={targetUsers}
			/>
		</section>
	);
}
