import type { Prisma, PrismaClient } from "@prisma/client";
import { FamilyRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateUserInfoInput = Readonly<{
	userId: string;
	name: string;
	familyRole?: FamilyRole;
	symbolPubKey?: string | null;
}>;

type UserInfoDbClient = PrismaClient | Prisma.TransactionClient;

export async function createUserInfo(
	input: CreateUserInfoInput,
	db: UserInfoDbClient = prisma,
) {
	const userId = input.userId.trim();
	const name = input.name.trim();
	const symbolPubKey = input.symbolPubKey?.trim() || null;

	if (!userId) {
		throw new Error("userId is required");
	}

	if (!name) {
		throw new Error("name is required");
	}

	return db.userInfo.create({
		data: {
			userId,
			name,
			familyRole: input.familyRole ?? FamilyRole.child,
			symbolPubKey,
		},
	});
}
