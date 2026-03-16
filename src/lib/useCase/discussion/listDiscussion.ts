import { prisma } from "@/lib/prisma";

export type ListDiscussionResult = Array<{
	id: string;
	title: string;
	detail: string;
	createdAt: Date;
	updatedAt: Date;
	authorUser: {
		id: string;
		email: string;
		name: string | null;
		familyRole: string | null;
	} | null;
}>;

export async function listDiscussion(
	userId: string,
): Promise<ListDiscussionResult> {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	const discussions = await prisma.discussion.findMany({
		where: {
			userId: normalizedUserId,
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			title: true,
			detail: true,
			createdAt: true,
			updatedAt: true,
			authorUserId: true,
		},
	});

	const authorUserIds = [...new Set(discussions.map((discussion) => discussion.authorUserId))];
	const authorUsers = authorUserIds.length
		? await prisma.user.findMany({
				where: {
					id: {
						in: authorUserIds,
					},
				},
				select: {
					id: true,
					email: true,
					userInfo: {
						select: {
							name: true,
							familyRole: true,
						},
					},
				},
			})
		: [];

	const authorUsersById = new Map(
		authorUsers.map((user) => [
			user.id,
			{
				id: user.id,
				email: user.email,
				name: user.userInfo?.name ?? null,
				familyRole: user.userInfo?.familyRole ?? null,
			},
		]),
	);

	return discussions.map((discussion) => ({
		id: discussion.id,
		title: discussion.title,
		detail: discussion.detail,
		createdAt: discussion.createdAt,
		updatedAt: discussion.updatedAt,
		authorUser: authorUsersById.get(discussion.authorUserId) ?? null,
	}));
}
