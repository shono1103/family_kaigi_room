import type { OwnedTicketItem } from "@/lib/symbol/tickets";

type TicketCardProps = {
	ticket: OwnedTicketItem;
	onClick: () => void;
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-2xl border border-black/10 bg-white/80 p-4 text-left shadow-[0_12px_28px_rgba(20,15,45,0.08)]"
		>
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-lg font-extrabold text-[#202033]">{ticket.name}</h3>
				<span
					className={`rounded-full px-2 py-1 text-xs font-bold ${
						ticket.isUsed
							? "bg-rose-100 text-rose-700"
							: "bg-emerald-100 text-emerald-700"
					}`}
				>
					{ticket.isUsed ? "使用済み" : "未使用"}
				</span>
			</div>
			<p className="mt-2 whitespace-pre-wrap text-sm font-medium text-[#4b4b65]">
				{ticket.detail}
			</p>
			<div className="mt-3 space-y-1 rounded-lg border border-black/10 bg-black/[0.02] p-3 text-xs font-semibold text-[#55556d]">
				<p>Mosaic ID: {ticket.mosaicId}</p>
				<p>保有枚数: {ticket.amountRaw}</p>
				<p>Metadata件数: {ticket.metadataEntries.length}</p>
				{ticket.thumbnail ? <p>画像ハッシュ: {ticket.thumbnail.sha256}</p> : null}
			</div>
		</button>
	);
}
