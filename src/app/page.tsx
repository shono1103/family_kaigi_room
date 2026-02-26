import { HomeClient } from "./components/home/homeClient";
import { listActiveSessions, requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function formatDateLabel(date: Date) {
	return new Intl.DateTimeFormat("ja-JP", {
		timeZone: "Asia/Tokyo",
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

export default async function Home() {
	const auth = await requireAuth();
	const sessions = await listActiveSessions(auth.user.id);
	const userInfo = await prisma.userInfo.findUnique({
		where: {
			userId: auth.user.id,
		},
		select: {
			name: true,
			role: true,
			symbolPubKey: true,
		},
	});

	return (
		<HomeClient
			userEmail={auth.user.email}
			userInfo={userInfo}
			currentSessionId={auth.session.id}
			sessions={sessions.map((session) => ({
				id: session.id,
				createdAtLabel: formatDateLabel(session.createdAt),
				expiresAtLabel: formatDateLabel(session.expiresAt),
			}))}
		/>
	);
}
