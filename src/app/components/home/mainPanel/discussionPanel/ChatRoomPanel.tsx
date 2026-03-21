"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "./types";

type Props = {
	chatRoomId: string;
	discussionTitle: string;
	onBack: () => void;
};

function formatTime(date: Date) {
	return new Intl.DateTimeFormat("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export function ChatRoomPanel({ chatRoomId, discussionTitle, onBack }: Props) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setIsLoading(true);
		fetch(`/api/chat/${chatRoomId}`)
			.then((res) => res.json())
			.then((data: { ok: boolean; messages?: ChatMessage[] }) => {
				if (data.ok && data.messages) {
					setMessages(
						data.messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })),
					);
				}
			})
			.finally(() => setIsLoading(false));
	}, [chatRoomId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const formData = new FormData(form);
		const content = formData.get("content");
		if (typeof content !== "string" || !content.trim()) return;

		setSendError(null);
		setIsSending(true);
		try {
			const res = await fetch(`/api/chat/${chatRoomId}`, {
				method: "POST",
				body: formData,
			});
			const data = (await res.json()) as {
				ok: boolean;
				message?: ChatMessage;
				message_text?: string;
			};
			if (!res.ok || !data.ok) {
				setSendError("送信に失敗しました。");
				return;
			}
			if (data.message) {
				setMessages((prev) => [
					...prev,
					{
						...data.message!,
						createdAt: new Date(data.message!.createdAt),
						isCurrentUser: true,
						authorName: null,
					},
				]);
			}
			form.reset();
		} catch {
			setSendError("通信エラーが発生しました。");
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-3 border-b border-black/8 pb-4">
				<button
					type="button"
					onClick={onBack}
					className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
				>
					← 議論に戻る
				</button>
				<h2 className="truncate text-lg font-bold text-[#1e1e2a]">{discussionTitle}</h2>
			</div>

			<div className="mt-4 flex-1 space-y-3 overflow-y-auto">
				{isLoading ? (
					<p className="text-center text-sm text-[#9b9bb5]">読み込み中...</p>
				) : messages.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.03] p-6 text-center text-sm font-semibold text-[#4b4b65]">
						まだメッセージはありません。最初のメッセージを送ってみましょう。
					</div>
				) : (
					messages.map((m) => (
						<div
							key={m.id}
							className={["flex flex-col gap-1", m.isCurrentUser ? "items-end" : "items-start"].join(" ")}
						>
							{!m.isCurrentUser && (
								<span className="text-xs font-semibold text-[#7b7b95]">
									{m.authorName ?? "不明"}
								</span>
							)}
							<div
								className={[
									"max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6",
									m.isCurrentUser
										? "rounded-tr-sm bg-[#1e1e2a] text-white"
										: "rounded-tl-sm bg-black/[0.06] text-[#1e1e2a]",
								].join(" ")}
							>
								{m.content}
							</div>
							<span className="text-[11px] text-[#b0b0c5]">{formatTime(m.createdAt)}</span>
						</div>
					))
				)}
				<div ref={bottomRef} />
			</div>

			<form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t border-black/8 pt-4">
				<input
					name="content"
					required
					disabled={isSending}
					className="flex-1 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
					placeholder="メッセージを入力..."
					autoComplete="off"
				/>
				<button
					type="submit"
					disabled={isSending}
					className="rounded-xl bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
				>
					{isSending ? "送信中" : "送信"}
				</button>
			</form>
			{sendError && (
				<p className="mt-2 text-xs font-semibold text-rose-600">{sendError}</p>
			)}
		</div>
	);
}
