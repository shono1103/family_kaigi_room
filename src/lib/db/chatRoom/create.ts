import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ChatRoomDbClient = PrismaClient | Prisma.TransactionClient;

export async function createChatRoom(
	discussionId: string,
	db: ChatRoomDbClient = prisma,
) {
	return db.discussionChatRoom.create({
		data: { discussionId },
	});
}
