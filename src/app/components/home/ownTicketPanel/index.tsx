"use client";

import { useState } from "react";
import type { OwnedTicketItem } from "@/lib/symbol/useCase/ticket/model";
import { OwnTicketPanelStatus } from "./OwnTicketPanelStatus";
import { TicketDetailModal } from "./TicketDetailModal";
import { TicketGrid } from "./TicketGrid";
import { TicketIssueModal } from "./TicketIssueModal";
import type { OwnTicketPanelProps } from "./types";
import { useTicketIssue } from "./useTicketIssue";

export function OwnTicketPanel({
	isActive,
	index,
	ownedTickets,
}: OwnTicketPanelProps) {
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState<OwnedTicketItem | null>(
		null,
	);
	const {
		isSubmitting,
		submitError,
		submitSuccess,
		clearMessages,
		submitTicketIssue,
	} = useTicketIssue();

	const openIssueModal = () => {
		clearMessages();
		setIsIssueModalOpen(true);
	};

	const closeIssueModal = () => {
		setIsIssueModalOpen(false);
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
				<h2 className="mt-0 text-2xl font-semibold">保有チケット</h2>
				<button
					type="button"
					onClick={openIssueModal}
					className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
				>
					チケット発行
				</button>
			</div>
			<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
				Symbolアカウントに保有しているモザイクIDを表示します。
			</p>
			<div className="mt-4">
				{ownedTickets.status === "ok" && ownedTickets.tickets.length > 0 ? (
					<TicketGrid
						tickets={ownedTickets.tickets}
						onSelectTicket={setSelectedTicket}
					/>
				) : (
					<OwnTicketPanelStatus ownedTickets={ownedTickets} />
				)}
			</div>
			{submitSuccess ? (
				<p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
					{submitSuccess}
				</p>
			) : null}
			{submitError ? (
				<p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
					{submitError}
				</p>
			) : null}

			<TicketIssueModal
				isOpen={isIssueModalOpen}
				onClose={closeIssueModal}
				onSubmit={async (event) => {
					const isSuccess = await submitTicketIssue(event);
					if (isSuccess) {
						setIsIssueModalOpen(false);
					}
					return isSuccess;
				}}
				isSubmitting={isSubmitting}
			/>
			<TicketDetailModal
				ticket={selectedTicket}
				onClose={() => setSelectedTicket(null)}
			/>
		</section>
	);
}
