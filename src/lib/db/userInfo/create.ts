import { FamilyRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateUserInfoInput = Readonly<{
	userId: string;
	name: string;
	familyRole?: FamilyRole;
	symbolPubKey?: string | null;
}>;

export async function createUserInfo(input: CreateUserInfoInput) {
	const userId = input.userId.trim();
	const name = input.name.trim();
	const symbolPubKey = input.symbolPubKey?.trim() || null;

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!name) {
		throw new Error("name is required");
	}

	return prisma.userInfo.create({
		data: {
			userId,
			name,
			familyRole: input.familyRole ?? FamilyRole.child,
			symbolPubKey,
		},
	});
}
