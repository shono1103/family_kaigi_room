"use client";

import { useState } from "react";
import { QuestIssueModal } from "./QuestIssueModal";
import type { QuestPanelProps } from "./types";
import { useQuestIssue } from "./useQuestIssue";

export function QuestPanel({ isActive, index }: QuestPanelProps) {
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
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
						家族向けのクエストを作成できます。現在は作成機能のみ実装されています。
					</p>
				</div>
				<button
					type="button"
					onClick={openIssueModal}
					className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
				>
					クエスト作成
				</button>
			</div>

			<div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-black/[0.03] p-6 text-sm font-semibold text-[#4b4b65]">
				クエスト一覧はまだ未実装です。ここから新しいクエストを登録できます。
			</div>

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
			/>
		</section>
	);
}
