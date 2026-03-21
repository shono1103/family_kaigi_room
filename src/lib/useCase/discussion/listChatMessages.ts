import { listChatMessagesByChatRoomId } from "@/lib/db/chatMessage/read";
import { prisma } from "@/lib/prisma";

export type ListChatMessagesResult = Array<{
	id: string;
	content: string;
	createdAt: Date;
	authorName: string | null;
	authorUserId: string;
	isCurrentUser: boolean;
}>;

export async function listChatMessages(
	chatRoomId: string,
	requestUserId: string,
): Promise<ListChatMessagesResult> {
	const chatRoom = await prisma.discussionChatRoom.findUnique({
		where: { id: chatRoomId },
		select: {
			discussion: {
				select: { familyId: true },
			},
		},
	});

	if (!chatRoom) throw new Error("chat room not found");

	const user = await prisma.user.findUnique({
		where: { id: requestUserId },
		select: { familyId: true },
	});

	if (user?.familyId !== chatRoom.discussion.familyId) {
		throw new Error("access denied");
	}

	const messages = await listChatMessagesByChatRoomId(chatRoomId);

	const userIds = [...new Set(messages.map((m) => m.userId))];
	const users = userIds.length
		? await prisma.user.findMany({
				where: { id: { in: userIds } },
				select: {
					id: true,
					userInfo: { select: { name: true } },
				},
			})
		: [];

	const usersById = new Map(
		users.map((u) => [u.id, u.userInfo?.name ?? null]),
	);

	return messages.map((m) => ({
		id: m.id,
		content: m.content,
		createdAt: m.createdAt,
		authorName: usersById.get(m.userId) ?? null,
		authorUserId: m.userId,
		isCurrentUser: m.userId === requestUserId,
	}));
}
