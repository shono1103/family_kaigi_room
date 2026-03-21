"use client";

import type { DiscussionPostModalProps } from "./types";

export function DiscussionPostModal({
	isOpen,
	onClose,
	onSubmit,
	isSubmitting,
}: DiscussionPostModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-8"
			role="dialog"
			aria-modal="true"
			aria-label="議論投稿"
		>
			<div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-[0_18px_55px_rgba(20,15,45,0.28)]">
				<div className="flex items-center justify-between gap-4">
					<h3 className="text-xl font-extrabold text-[#1e1e2a]">議論を投稿</h3>
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
						<label htmlFor="discussion-title" className="text-sm font-bold text-[#2f2f47]">
							議論タイトル
						</label>
						<input
							id="discussion-title"
							name="title"
							required
							maxLength={100}
							disabled={isSubmitting}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
							placeholder="例: 夏休みの旅行先をどうするか"
						/>
					</div>
					<div>
						<label htmlFor="discussion-detail" className="text-sm font-bold text-[#2f2f47]">
							議論内容
						</label>
						<textarea
							id="discussion-detail"
							name="detail"
							required
							maxLength={1200}
							rows={5}
							disabled={isSubmitting}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
							placeholder="家族で話したい内容を入力"
						/>
					</div>
					<div>
						<label htmlFor="discussion-symbol-priv-key" className="text-sm font-bold text-[#2f2f47]">
							Symbol 秘密鍵
						</label>
						<p className="mt-0.5 text-xs text-[#7b7b95]">
							議論の発行には 3 Voice を消費します。あなたの Symbol 秘密鍵を入力してください。
						</p>
						<input
							id="discussion-symbol-priv-key"
							name="symbolPrivKey"
							type="password"
							required
							disabled={isSubmitting}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-mono"
							placeholder="64文字の16進数"
						/>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
						>
							キャンセル
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
						>
							{isSubmitting ? "投稿中..." : "議論を投稿 (3 Voice)"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
