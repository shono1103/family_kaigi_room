import { HomeClient } from "./components/home/homeClient";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { readAccountOwnedMosaicsByPublicKey } from "@/lib/symbol/useCase/account/read"
import { getTicketDetails } from "@/lib/symbol/useCase/ticket/read";
import { readFamilyCurrencyForUser } from "@/lib/useCase/family/currency/read";

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
	const { family, familyCurrency } = await readFamilyCurrencyForUser(
		auth.user.id,
		userInfo?.symbolPubKey,
	);
	const ownedMosaics = await readAccountOwnedMosaicsByPublicKey(userInfo?.symbolPubKey);
	const ownedTickets = ownedMosaics.ok
		? await (async () => {
			const detailsResults = await Promise.all(
				ownedMosaics.mosaics.map(async (mosaic) => {
					const mosaicId = `0x${mosaic.mosaicIdHex}`;
					const details = await getTicketDetails(mosaicId);
					return { mosaic, mosaicId, details };
				}),
			);

			const tickets = detailsResults.flatMap((entry) => {
				const details = entry.details;
				if (!details.ok) {
					return [];
				}
				return [
					{
						mosaicId: entry.mosaicId,
						amountRaw: entry.mosaic.amountRaw,
						name: details.ticketMetadata.name,
						detail: details.ticketMetadata.detail,
						isUsed: details.ticketMetadata.isUsed,
						thumbnail: details.ticketMetadata.thumbnail,
						metadataEntries: details.metadataEntries.map((metadataEntry) =>
							JSON.stringify(metadataEntry),
						),
					},
				];
			});

			const hasReadFailed = detailsResults.some(
				(entry) => !entry.details.ok && entry.details.status === "read_failed",
			);

			if (tickets.length === 0 && hasReadFailed) {
				return {
					status: "node_unreachable" as const,
					tickets: [],
				};
			}

			return {
				status: "ok" as const,
				tickets,
			};
		})()
		: {
			status:
				ownedMosaics.status === "read_failed"
					? ("node_unreachable" as const)
					: ownedMosaics.status,
			tickets: [],
		};

	return (
		<HomeClient
			userEmail={auth.user.email}
			familyName={family?.familyName ?? null}
			userInfo={userInfo}
			familyCurrency={familyCurrency}
			ownedMosaics={ownedMosaics}
			ownedTickets={ownedTickets}
			initialTab={resolvedSearchParams?.tab}
		/>
	);
}
