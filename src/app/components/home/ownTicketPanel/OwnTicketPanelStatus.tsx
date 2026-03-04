import type { OwnedTicketsResult } from "@/lib/symbol/tickets";

type OwnTicketPanelStatusProps = {
	ownedTickets: OwnedTicketsResult;
};

export function OwnTicketPanelStatus({ ownedTickets }: OwnTicketPanelStatusProps) {
	if (ownedTickets.status === "ok") {
		if (ownedTickets.tickets.length > 0) {
			return null;
		}

		return (
			<div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm font-semibold text-[#4b4b65]">
				保有チケットはありません。
			</div>
		);
	}

	const message =
		ownedTickets.status === "missing_public_key"
			? "公開鍵が未設定です。基本情報から設定してください。"
			: ownedTickets.status === "invalid_public_key"
				? "公開鍵の形式が不正です。基本情報で修正してください。"
				: ownedTickets.status === "account_not_found"
					? "指定された公開鍵のSymbolアカウントが見つかりません。"
					: "Symbolノードへ接続できませんでした。時間をおいて再試行してください。";

	return (
		<div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm font-semibold text-[#4b4b65]">
			{message}
		</div>
	);
}
