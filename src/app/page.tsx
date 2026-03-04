import { HomeClient } from "./components/home/homeClient";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getXymBalanceByPublicKey } from "@/lib/symbol/balance";
import { getOwnedTicketsByPublicKey } from "@/lib/symbol/tickets";

type HomePageProps = {
	searchParams?: Promise<{
		tab?: string;
	}>;
};

export default async function Home({ searchParams }: HomePageProps) {
	const auth = await requireAuth();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const userInfo = await prisma.userInfo.findUnique({
		where: {
			userId: auth.user.id,
		},
		select: {
			name: true,
			symbolPubKey: true,
		},
	});
	const xymBalance = await getXymBalanceByPublicKey(userInfo?.symbolPubKey);
	const ownedTickets = await getOwnedTicketsByPublicKey(userInfo?.symbolPubKey);

	return (
		<HomeClient
			userEmail={auth.user.email}
			userInfo={userInfo}
			xymBalance={xymBalance}
			ownedTickets={ownedTickets}
			initialTab={resolvedSearchParams?.tab}
		/>
	);
}
