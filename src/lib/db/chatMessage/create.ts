import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateChatMessageInput = Readonly<{
	chatRoomId: string;
	userId: string;
	content: string;
}>;

type ChatMessageDbClient = PrismaClient | Prisma.TransactionClient;

export async function createChatMessage(
	input: CreateChatMessageInput,
	db: ChatMessageDbClient = prisma,
) {
	return db.discussionChatMessage.create({
		data: {
			chatRoomId: input.chatRoomId,
			userId: input.userId,
			content: input.content,
		},
	});
}
