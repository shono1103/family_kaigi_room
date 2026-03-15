"use client";

import { useState, type FormEvent } from "react";
import { AgendaItemCard } from "./AgendaItemCard";
import { AgendaPostModal } from "./AgendaPostModal";
import type { AgendaItem, AgendaPanelProps } from "./types";

const initialAgendaItems: AgendaItem[] = [
	{
		id: "agenda-1",
		title: "夏休みの旅行先を決める",
		detail: "行き先候補を 3 つまで出して、予算感も一緒に整理する。",
		author: "お父さん",
		createdAt: "2026/03/15 09:00",
	},
	{
		id: "agenda-2",
		title: "来月のお小遣いルール",
		detail: "Voice とお小遣いの連動ルールを見直す。",
		author: "お母さん",
		createdAt: "2026/03/14 20:15",
	},
	{
		id: "agenda-3",
		title: "週末の家事分担",
		detail: "掃除、洗濯、買い出しを誰が担当するか決める。",
		author: "子ども",
		createdAt: "2026/03/13 18:30",
	},
];

export function AgendaPanel({ isActive, index }: AgendaPanelProps) {
	const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(initialAgendaItems);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const title = String(formData.get("title") ?? "").trim();
		const detail = String(formData.get("detail") ?? "").trim();
		if (!title || !detail) {
			return;
		}

		const nextItem: AgendaItem = {
			id: crypto.randomUUID(),
			title,
			detail,
			author: "あなた",
			createdAt: new Intl.DateTimeFormat("ja-JP", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			}).format(new Date()),
		};

		setAgendaItems((current) => [nextItem, ...current]);
		setIsModalOpen(false);
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
					<h2 className="mt-0 text-2xl font-semibold">議題</h2>
					<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
						family 内で話し合いたい議題を投稿して一覧表示します。
					</p>
				</div>
				<button
					type="button"
					onClick={() => setIsModalOpen(true)}
					className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
				>
					議題を投稿
				</button>
			</div>

			<div className="mt-6 grid gap-4">
				{agendaItems.map((item) => (
					<AgendaItemCard key={item.id} item={item} />
				))}
			</div>

			<AgendaPostModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleSubmit}
			/>
		</section>
	);
}
