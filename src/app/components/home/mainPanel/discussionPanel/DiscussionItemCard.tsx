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

export function DiscussionItemCard({ item }: { item: DiscussionItem }) {
	return (
		<article className="rounded-3xl border border-black/10 bg-[linear-gradient(180deg,#ffffff,#f6f7fb)] p-5 shadow-[0_10px_28px_rgba(20,15,45,0.06)]">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-lg font-bold text-[#202033]">{item.title}</p>
					<p className="mt-2 text-sm font-semibold text-[#5b5b75]">
						投稿者: {item.authorName}
					</p>
				</div>
				<span className="rounded-full bg-black/[0.05] px-3 py-1 text-xs font-bold text-[#5b5b75]">
					{formatDiscussionDate(item.createdAt)}
				</span>
			</div>
			<p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#3a3a52]">
				{item.detail}
			</p>
		</article>
	);
}
