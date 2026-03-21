import { prisma } from "@/lib/prisma";

export async function listChatMessagesByChatRoomId(chatRoomId: string) {
	return prisma.discussionChatMessage.findMany({
		where: { chatRoomId },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			content: true,
			createdAt: true,
			userId: true,
		},
	});
}
