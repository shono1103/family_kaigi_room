import type { TicketIssueModalProps } from "./types";

export function TicketIssueModal({
	isOpen,
	onClose,
	onSubmit,
	isSubmitting,
}: TicketIssueModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-8"
			role="dialog"
			aria-modal="true"
			aria-label="チケット発行"
		>
			<div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-[0_18px_55px_rgba(20,15,45,0.28)]">
				<div className="flex items-center justify-between gap-4">
					<h3 className="text-xl font-extrabold text-[#1e1e2a]">チケット発行</h3>
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
						<label htmlFor="ticket-name" className="text-sm font-bold text-[#2f2f47]">
							名称
						</label>
						<input
							id="ticket-name"
							name="name"
							required
							maxLength={100}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
							placeholder="例: 2026春ライブ S席"
						/>
					</div>
					<div>
						<label htmlFor="ticket-detail" className="text-sm font-bold text-[#2f2f47]">
							詳細
						</label>
						<textarea
							id="ticket-detail"
							name="detail"
							required
							maxLength={1200}
							rows={5}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
							placeholder="公演日・会場・座席などを入力"
						/>
					</div>
					<div>
						<label
							htmlFor="ticket-thumbnail"
							className="text-sm font-bold text-[#2f2f47]"
						>
							サムネイル画像
						</label>
						<input
							id="ticket-thumbnail"
							type="file"
							name="thumbnailImage"
							required
							accept="image/*"
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#1e1e2a] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
						/>
						<p className="mt-1 text-xs font-medium text-[#5f5f77]">
							画像本体ではなく、画像情報（SHA-256など）をオンチェーンに保存します。
						</p>
					</div>
					<div>
						<label
							htmlFor="ticket-issuer-private-key"
							className="text-sm font-bold text-[#2f2f47]"
						>
							発行者秘密鍵
						</label>
						<input
							id="ticket-issuer-private-key"
							type="password"
							name="issuerPrivateKey"
							required
							minLength={64}
							maxLength={66}
							autoComplete="off"
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 font-mono text-sm tracking-[0.02em]"
							placeholder="64桁16進数（0x プレフィックス可）"
						/>
					</div>
					<label className="flex items-center gap-2 text-sm font-semibold text-[#2f2f47]">
						<input
							type="checkbox"
							name="isUsed"
							value="true"
							className="size-4 rounded border-black/20"
						/>
						使用済み？
					</label>

					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
							disabled={isSubmitting}
						>
							キャンセル
						</button>
						<button
							type="submit"
							className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={isSubmitting}
						>
							{isSubmitting ? "発行中..." : "発行する"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
