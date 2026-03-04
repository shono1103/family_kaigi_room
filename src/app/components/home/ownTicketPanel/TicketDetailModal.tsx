import type { TicketDetailModalProps } from "./types";

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
	if (!ticket) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-8"
			role="dialog"
			aria-modal="true"
			aria-label="モザイク詳細"
		>
			<div className="w-full max-w-[760px] rounded-2xl bg-white p-6 shadow-[0_18px_55px_rgba(20,15,45,0.28)]">
				<div className="flex items-center justify-between gap-4">
					<h3 className="text-xl font-extrabold text-[#1e1e2a]">モザイク詳細</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-black/15 px-3 py-1 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
					>
						閉じる
					</button>
				</div>
				<div className="mt-4 space-y-2 rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm font-semibold text-[#3c3c55]">
					<p>Mosaic ID: {ticket.mosaicId}</p>
					<p>保有枚数: {ticket.amountRaw}</p>
					<p>名称: {ticket.name}</p>
					<p>状態: {ticket.isUsed ? "使用済み" : "未使用"}</p>
					<p>詳細: {ticket.detail}</p>
				</div>
				<div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] p-4">
					<p className="text-sm font-bold text-[#303048]">
						Metadata ({ticket.metadataEntries.length})
					</p>
					{ticket.metadataEntries.length ? (
						<div className="mt-3 space-y-2">
							{ticket.metadataEntries.map((entry, index) => (
								<pre
									key={`${ticket.mosaicId}-metadata-${index}`}
									className="overflow-x-auto rounded-lg border border-black/10 bg-white p-3 text-xs font-medium text-[#2f2f44]"
								>
									{entry}
								</pre>
							))}
						</div>
					) : (
						<p className="mt-2 text-sm font-semibold text-[#5a5a72]">
							メタデータは見つかりませんでした。
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
