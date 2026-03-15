"use client";

import type { AgendaPostModalProps } from "./types";

export function AgendaPostModal({
	isOpen,
	onClose,
	onSubmit,
}: AgendaPostModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-8"
			role="dialog"
			aria-modal="true"
			aria-label="議題投稿"
		>
			<div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-[0_18px_55px_rgba(20,15,45,0.28)]">
				<div className="flex items-center justify-between gap-4">
					<h3 className="text-xl font-extrabold text-[#1e1e2a]">議題を投稿</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-black/15 px-3 py-1 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
					>
						閉じる
					</button>
				</div>

				<form onSubmit={onSubmit} className="mt-5 space-y-4">
					<div>
						<label htmlFor="agenda-title" className="text-sm font-bold text-[#2f2f47]">
							議題タイトル
						</label>
						<input
							id="agenda-title"
							name="title"
							required
							maxLength={100}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
							placeholder="例: 夏休みの旅行先"
						/>
					</div>
					<div>
						<label htmlFor="agenda-detail" className="text-sm font-bold text-[#2f2f47]">
							議題内容
						</label>
						<textarea
							id="agenda-detail"
							name="detail"
							required
							maxLength={1200}
							rows={6}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
							placeholder="話し合いたい内容を入力"
						/>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
						>
							キャンセル
						</button>
						<button
							type="submit"
							className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
						>
							投稿する
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
