"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DiscussionItemCard } from "./DiscussionItemCard";
import { DiscussionPostModal } from "./DiscussionPostModal";
import type {
	DiscussionCreateResponse,
	DiscussionItem,
	DiscussionPanelProps,
} from "./types";

const CREATE_REQUEST_TIMEOUT_MS = 15000;

export function DiscussionPanel({ isActive, index }: DiscussionPanelProps) {
	const router = useRouter();
	const [discussionItems, setDiscussionItems] = useState<DiscussionItem[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

	const clearMessages = () => {
		setSubmitError(null);
		setSubmitSuccess(null);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
				CREATE_REQUEST_TIMEOUT_MS,
			);

			const response = await fetch("/api/discussion", {
				method: "POST",
				body: formData,
				signal: abortController.signal,
			});
			const result = (await response.json()) as DiscussionCreateResponse;
			if (!response.ok || !result.ok || !result.discussion) {
				setSubmitError(
					result.message ??
						"議論の投稿に失敗しました。時間をおいて再試行してください。",
				);
				return false;
			}

			const nextItem: DiscussionItem = {
				id: result.discussion.id,
				title: result.discussion.title,
				detail: result.discussion.detail,
				authorName: "あなた",
				createdAt: new Date(result.discussion.createdAt),
			};

			setDiscussionItems((current) => [nextItem, ...current]);
			setSubmitSuccess(
				result.discussion.title
					? `議論「${result.discussion.title}」を投稿しました。`
					: "議論を投稿しました。",
			);
			form.reset();
			setIsModalOpen(false);
			router.refresh();
			return true;
		} catch (error) {
			const knownError = error as { name?: string } | null;
			if (knownError?.name === "AbortError") {
				setSubmitError("投稿処理がタイムアウトしました。もう一度お試しください。");
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
					<h2 className="mt-0 text-2xl font-semibold">議論</h2>
					<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
						family 内で話し合いたい内容を discussion として投稿して一覧表示します。
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
						clearMessages();
						setIsModalOpen(true);
					}}
					className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
				>
					議論を投稿
				</button>
			</div>

			<div className="mt-6 grid gap-4">
				{discussionItems.length > 0 ? (
					discussionItems.map((item) => (
						<DiscussionItemCard key={item.id} item={item} />
					))
				) : (
					<div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.03] p-6 text-sm font-semibold text-[#4b4b65]">
						まだ discussion はありません。
					</div>
				)}
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

			<DiscussionPostModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
			/>
		</section>
	);
}
