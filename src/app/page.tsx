import { redirect } from "next/navigation";
import { HomeClient } from "./components/home/homeClient";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { readUserFamilyByUserId } from "@/lib/db/user/read";
import { listFamilyMembers } from "@/lib/useCase/family/listFamilyMembers";
import { listIssuedQuests } from "@/lib/useCase/quest/listIssuedQuests";
import { listTargetQuests } from "@/lib/useCase/quest/listTargetQuests";
import { readUserVoice } from "@/lib/useCase/user/readUserVoice";

type HomePageProps = {
	searchParams?: Promise<{
		tab?: string;
	}>;
};

export default async function Home({ searchParams }: HomePageProps) {
	const auth = await requireAuth();
	const user = await prisma.user.findUnique({
		where: { id: auth.user.id },
		select: { isFirst: true, isFamilyOwner: true },
	});
	if (user?.isFirst) {
		redirect("/first-login");
	}
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
	const [{ family }, userVoice] = await Promise.all([
		readUserFamilyByUserId(auth.user.id),
		readUserVoice(auth.user.id),
	]);
	const familyMembers = (await listFamilyMembers(auth.user.id)).map((member) => ({
		...member,
		isCurrentUser: member.id === auth.user.id,
	}));
	const [issuedQuests, targetQuests] = await Promise.all([
		listIssuedQuests(auth.user.id),
		listTargetQuests(auth.user.id),
	]);
	const questTargetUsers = familyMembers
		.filter((member) => !member.isCurrentUser)
		.map((member) => ({
			id: member.id,
			label: member.name,
		}));

	return (
		<HomeClient
			userEmail={auth.user.email}
			isFamilyOwner={user?.isFamilyOwner ?? false}
			familyName={family?.familyName ?? null}
			userInfo={userInfo}
			userVoiceAmountRaw={userVoice.ok ? userVoice.amountRaw : "0"}
			issuedQuests={issuedQuests}
			questTargetUsers={questTargetUsers}
			familyMembers={familyMembers}
			targetQuests={targetQuests}
			initialTab={resolvedSearchParams?.tab}
		/>
	);
}
