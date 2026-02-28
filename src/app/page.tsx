import { HomeClient } from "./components/home/homeClient";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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

	return (
		<HomeClient
			userEmail={auth.user.email}
			userInfo={userInfo}
			initialTab={resolvedSearchParams?.tab}
		/>
	);
}
