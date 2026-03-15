import { redirect } from "next/navigation";
import { SymbolAccountReviewClient } from "./SymbolAccountReviewClient";
import { getCurrentAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function SymbolAccountReviewPage() {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		redirect("/login");
	}

	const user = await prisma.user.findUnique({
		where: { id: auth.user.id },
		select: { isFirst: true },
	});

	if (user?.isFirst) {
		redirect("/first-login/password");
	}

	return <SymbolAccountReviewClient />;
}
