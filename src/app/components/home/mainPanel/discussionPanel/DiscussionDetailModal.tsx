"use client";

import type { DiscussionItem } from "./types";

function formatDiscussionDate(date: Date) {
	return new Intl.DateTimeFormat("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

type Props = {
	item: DiscussionItem;
	onClose: () => void;
	onOpenChatRoom: (chatRoomId: string) => void;
};

export function DiscussionDetailModal({ item, onClose, onOpenChatRoom }: Props) {
	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-8"
			role="dialog"
			aria-modal="true"
			aria-label="議論詳細"
		>
			<div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-[0_18px_55px_rgba(20,15,45,0.28)]">
				<div className="flex items-start justify-between gap-4">
					<h3 className="text-xl font-extrabold text-[#1e1e2a]">{item.title}</h3>
					<button
						type="button"
						onClick={onClose}
						className="shrink-0 rounded-md border border-black/15 px-3 py-1 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
					>
						閉じる
					</button>
				</div>

				<div className="mt-2 flex items-center gap-3 text-xs text-[#7b7b95]">
					<span>投稿者: {item.authorName ?? "不明"}</span>
					<span>{formatDiscussionDate(item.createdAt)}</span>
				</div>

				<p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#3a3a52]">
					{item.detail}
				</p>

				<div className="mt-6 flex justify-end">
					{item.chatRoomId ? (
						<button
							type="button"
							onClick={() => onOpenChatRoom(item.chatRoomId!)}
							className="rounded-lg bg-[#1e1e2a] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
						>
							チャットルームへ →
						</button>
					) : (
						<span className="text-xs text-[#9b9bb5]">チャットルームがありません</span>
					)}
				</div>
			</div>
		</div>
	);
}
