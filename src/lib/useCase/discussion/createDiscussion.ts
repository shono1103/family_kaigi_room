import type { Prisma } from "@prisma/client";
import {
	createDiscussion as createDiscussionRecord,
	type CreateDiscussionInput,
} from "@/lib/db/discussion/create";
import { createChatRoom } from "@/lib/db/chatRoom/create";
import { prisma } from "@/lib/prisma";
import { sendVoiceOnChain } from "@/lib/symbol/useCase/voice/send";

const VOICE_COST = 3n;

export type CreateDiscussionUseCaseInput = Readonly<{
	userId: CreateDiscussionInput["userId"];
	title: CreateDiscussionInput["title"];
	detail: CreateDiscussionInput["detail"];
	symbolPrivKey: string;
}>;

export type CreateDiscussionUseCaseResult = Readonly<{
	discussion: Awaited<ReturnType<typeof createDiscussionRecord>>;
	chatRoomId: string;
}>;

export async function createDiscussion(
	input: CreateDiscussionUseCaseInput,
): Promise<CreateDiscussionUseCaseResult> {
	const userId = input.userId.trim();
	const title = input.title.trim();
	const detail = input.detail.trim();
	const symbolPrivKey = input.symbolPrivKey.trim();

	if (!userId) throw new Error("userId is required");
	if (!title) throw new Error("title is required");
	if (!detail) throw new Error("detail is required");
	if (!symbolPrivKey) throw new Error("symbolPrivKey is required");

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			familyId: true,
			family: {
				select: {
					symbolPubKey: true,
					familyVoiceMosaicId: true,
				},
			},
		},
	});

	if (!user?.familyId) throw new Error("user family was not found");
	if (!user.family?.symbolPubKey) throw new Error("family symbol account not found");
	if (!user.family?.familyVoiceMosaicId) throw new Error("family voice mosaic not found");

	const sendResult = await sendVoiceOnChain(
		symbolPrivKey,
		user.family.symbolPubKey,
		user.family.familyVoiceMosaicId,
		VOICE_COST,
		"Discussion creation fee",
	);

	if (!sendResult.ok) {
		throw new Error(`Voice の消費に失敗しました: ${sendResult.message}`);
	}

	const familyId = user.familyId;
	const { discussion, chatRoom } = await prisma.$transaction(
		async (tx: Prisma.TransactionClient) => {
			const discussion = await createDiscussionRecord(
				{
					userId,
					familyId,
					title,
					detail,
					authorUserId: userId,
				},
				tx,
			);
			const chatRoom = await createChatRoom(discussion.id, tx);
			return { discussion, chatRoom };
		},
	);

	return { discussion, chatRoomId: chatRoom.id };
}
