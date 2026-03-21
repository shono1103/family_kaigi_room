"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { QuestIssueModal } from "./QuestIssueModal";
import type {
	QuestEvaluateResponse,
	QuestIssueResponse,
	QuestPanelProps,
} from "./types";

type QuestListTab = "issued" | "target";
const ISSUE_REQUEST_TIMEOUT_MS = 15000;
const EVALUATE_REQUEST_TIMEOUT_MS = 30000;

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

function QuestTypeBadge({ questType }: { questType: string }) {
	const isFamily = questType === "familyQuest";
	return (
		<span
			className={[
				"rounded-full px-2 py-0.5 text-xs font-bold",
				isFamily
					? "bg-violet-100 text-violet-800"
					: "bg-orange-100 text-orange-800",
			].join(" ")}
		>
			{isFamily ? "ファミリー" : "パーソナル"}
		</span>
	);
}

type EvaluateFormProps = {
	questId: string;
	onEvaluated: (message: string) => void;
	onError: (message: string) => void;
};

function EvaluateForm({ questId, onEvaluated, onError }: EvaluateFormProps) {
	const [percent, setPercent] = useState(100);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		try {
			const formData = new FormData();
			formData.append("questId", questId);
			formData.append("evaluationPercent", String(percent));

			const abortController = new AbortController();
			timeoutId = setTimeout(
				() => abortController.abort(),
				EVALUATE_REQUEST_TIMEOUT_MS,
			);

			const response = await fetch("/api/quest/evaluate", {
				method: "POST",
				body: formData,
				signal: abortController.signal,
			});
			const result = (await response.json()) as QuestEvaluateResponse;

			if (!response.ok || !result.ok) {
				onError(result.message ?? "評価に失敗しました。");
				return;
			}

			const parts: string[] = [];
			if (result.rewardAmount === 0) {
				parts.push("報酬なし（評価0%）で完了しました。");
			} else if (result.rewardSent) {
				parts.push(`報酬 ${result.rewardAmount} Voice を対象者へ送金しました。`);
			} else {
				parts.push("評価を完了しました（報酬送金はスキップされました）。");
			}
			if (result.refundAmount && result.refundAmount > 0) {
				parts.push(
					result.refundSent
						? `残額 ${result.refundAmount} Voice をあなたへ返金しました。`
						: `残額 ${result.refundAmount} Voice の返金はスキップされました。`,
				);
			}
			onEvaluated(parts.join(" "));
		} catch (error) {
			const knownError = error as { name?: string } | null;
			if (knownError?.name === "AbortError") {
				onError("評価処理がタイムアウトしました。");
			} else {
				onError("通信エラーが発生しました。");
			}
		} finally {
			if (timeoutId) clearTimeout(timeoutId);
			setIsSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 bg-[#f8f8fc] px-4 py-3"
		>
			<label className="text-xs font-bold text-[#3a3a52]">評価</label>
			<input
				type="range"
				min={0}
				max={100}
				value={percent}
				onChange={(e) => setPercent(Number(e.target.value))}
				className="flex-1"
			/>
			<span className="w-10 text-right text-sm font-bold text-[#1e1e2a]">
				{percent}%
			</span>
			<button
				type="submit"
				disabled={isSubmitting}
				className="rounded-lg bg-[#1e1e2a] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSubmitting ? "送信中..." : "評価する"}
			</button>
		</form>
	);
}

export function QuestPanel({
	isActive,
	index,
	isFamilyOwner,
	issuedQuests,
	targetQuests,
	targetUsers,
}: QuestPanelProps) {
	const router = useRouter();
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
	const [activeQuestTab, setActiveQuestTab] = useState<QuestListTab>("issued");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

	const clearMessages = () => {
		setSubmitError(null);
		setSubmitSuccess(null);
	};

	const submitQuestIssue = async (
		event: FormEvent<HTMLFormElement>,
	): Promise<boolean> => {
		event.preventDefault();
		const form = event.currentTarget;
		const formData = new FormData(form);

		clearMessages();
		setIsSubmitting(true);
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		try {
			const abortController = new AbortController();
			timeoutId = setTimeout(
				() => abortController.abort(),
				ISSUE_REQUEST_TIMEOUT_MS,
			);

			const response = await fetch("/api/quest/issue", {
				method: "POST",
				body: formData,
				signal: abortController.signal,
			});
			const result = (await response.json()) as QuestIssueResponse;
			if (!response.ok || !result.ok) {
				setSubmitError(
					result.message ??
						"クエスト発行に失敗しました。時間をおいて再試行してください。",
				);
				return false;
			}

			if (result.quests) {
				setSubmitSuccess(
					`ファミリークエスト「${result.quests[0]?.title ?? ""}」を${result.quests.length}名に発行しました。`,
				);
			} else {
				setSubmitSuccess(
					result.quest?.title
						? `クエスト「${result.quest.title}」を作成しました。`
						: "クエストを作成しました。",
				);
			}
			form.reset();
			router.refresh();
			return true;
		} catch (error) {
			const knownError = error as { name?: string } | null;
			if (knownError?.name === "AbortError") {
				setSubmitError("作成処理がタイムアウトしました。もう一度お試しください。");
			} else {
				setSubmitError("通信エラーが発生しました。接続状態を確認してください。");
			}
			return false;
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			setIsSubmitting(false);
		}
	};

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
					disabled={targetUsers.length === 0 && !isFamilyOwner}
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
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-lg font-bold text-[#202033]">
												{quest.title}
											</p>
											<QuestTypeBadge questType={quest.questType} />
										</div>
										<p className="mt-2 text-sm font-semibold text-[#5b5b75]">
											対象: {quest.targetUser?.name ?? quest.targetUser?.email ?? "不明"}
										</p>
									</div>
									<div className="flex flex-col items-end gap-1">
										<QuestStatusBadge isResolved={quest.isResolved} />
										<span className="text-xs font-bold text-[#6a6a84]">
											報酬: {quest.voiceReward} Voice
										</span>
									</div>
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
									{quest.evaluationPercent !== null ? (
										<span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
											評価: {quest.evaluationPercent}%
											{quest.isRewarded
												? ` (${Math.floor((quest.voiceReward * quest.evaluationPercent) / 100)} Voice 送金済み)`
												: ""}
										</span>
									) : null}
								</div>
								{!quest.isResolved && quest.evaluationPercent === null ? (
									<EvaluateForm
										questId={quest.id}
										onEvaluated={(msg) => {
											setSubmitSuccess(msg);
											router.refresh();
										}}
										onError={(msg) => setSubmitError(msg)}
									/>
								) : null}
							</article>
						))
					) : (
						<div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.03] p-6 text-sm font-semibold text-[#4b4b65]">
							{targetUsers.length > 0 || isFamilyOwner
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
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-lg font-bold text-[#202033]">
												{quest.title}
											</p>
											<QuestTypeBadge questType={quest.questType} />
										</div>
										<p className="mt-2 text-sm font-semibold text-[#5b5b75]">
											発行者: {quest.issuerUser?.name ?? quest.issuerUser?.email ?? "不明"}
										</p>
									</div>
									<div className="flex flex-col items-end gap-1">
										<QuestStatusBadge isResolved={quest.isResolved} />
										<span className="text-xs font-bold text-[#6a6a84]">
											報酬: {quest.voiceReward} Voice
										</span>
									</div>
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
									{quest.evaluationPercent !== null ? (
										<span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
											評価: {quest.evaluationPercent}%
											{quest.isRewarded
												? ` (${Math.floor((quest.voiceReward * quest.evaluationPercent) / 100)} Voice 受取済み)`
												: ""}
										</span>
									) : (
										<span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
											評価待ち
										</span>
									)}
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
				isFamilyOwner={isFamilyOwner}
				targetUsers={targetUsers}
			/>
		</section>
	);
}
