import { prisma } from "@/lib/prisma";

export async function readUserInfoByUserId(userId: string) {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	return prisma.userInfo.findUnique({
		where: {
			userId: normalizedUserId,
		},
	});
}

export async function readUserInfoBySymbolPubKey(symbolPubKey: string) {
	const normalizedSymbolPubKey = symbolPubKey.trim();

	if (!normalizedSymbolPubKey) {
		throw new Error("symbolPubKey is required");
	}

	return prisma.userInfo.findUnique({
		where: {
			symbolPubKey: normalizedSymbolPubKey,
		},
	});
}
