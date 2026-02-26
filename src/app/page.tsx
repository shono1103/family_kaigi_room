import { HomeClient } from "./components/home/homeClient";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function Home() {
	const auth = await requireAuth();
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
		/>
	);
}
