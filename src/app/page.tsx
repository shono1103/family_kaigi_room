import { HomeClient } from "./components/home/homeClient";
import { listActiveSessions, requireAuth } from "@/lib/auth/session";

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

	return (
		<HomeClient
			userEmail={auth.user.email}
			currentSessionId={auth.session.id}
			sessions={sessions.map((session) => ({
				id: session.id,
				createdAtLabel: formatDateLabel(session.createdAt),
				expiresAtLabel: formatDateLabel(session.expiresAt),
			}))}
		/>
	);
}
