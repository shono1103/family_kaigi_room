import type { OwnedTicketItem } from "@/lib/symbol/tickets";
import { TicketCard } from "./TicketCard";

type TicketGridProps = {
	tickets: OwnedTicketItem[];
	onSelectTicket: (ticket: OwnedTicketItem) => void;
};

export function TicketGrid({ tickets, onSelectTicket }: TicketGridProps) {
	return (
		<div className="grid gap-3 md:grid-cols-2">
			{tickets.map((ticket) => (
				<TicketCard
					key={ticket.mosaicId}
					ticket={ticket}
					onClick={() => onSelectTicket(ticket)}
				/>
			))}
		</div>
	);
}
