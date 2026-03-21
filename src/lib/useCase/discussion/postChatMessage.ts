import { createChatMessage } from "@/lib/db/chatMessage/create";
import { prisma } from "@/lib/prisma";

export type PostChatMessageInput = Readonly<{
	chatRoomId: string;
	userId: string;
	content: string;
}>;

export async function postChatMessage(input: PostChatMessageInput) {
	const chatRoomId = input.chatRoomId.trim();
	const userId = input.userId.trim();
	const content = input.content.trim();

	if (!chatRoomId) throw new Error("chatRoomId is required");
	if (!userId) throw new Error("userId is required");
	if (!content) throw new Error("content is required");

	const chatRoom = await prisma.discussionChatRoom.findUnique({
		where: { id: chatRoomId },
		select: {
			discussion: { select: { familyId: true } },
		},
	});

	if (!chatRoom) throw new Error("chat room not found");

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { familyId: true },
	});

	if (user?.familyId !== chatRoom.discussion.familyId) {
		throw new Error("access denied");
	}

	return createChatMessage({ chatRoomId, userId, content });
}
