import type { Prisma } from "@prisma/client";
import { FamilyRole } from "@prisma/client";
import { createUserInfo, type CreateUserInfoInput } from "@/lib/db/userInfo/create";

export type RegisterFamilyUserInfoInput = Readonly<{
	userId: CreateUserInfoInput["userId"];
	name?: CreateUserInfoInput["name"];
	symbolPubKey?: CreateUserInfoInput["symbolPubKey"];
	familyRole?: FamilyRole;
}>;

export async function registerFamilyUserInfo(
	input: RegisterFamilyUserInfoInput,
	tx: Prisma.TransactionClient,
) {
	const normalizedName = input.name?.trim();
	if (!normalizedName) {
		return null;
	}

	return createUserInfo(
		{
			userId: input.userId,
			name: normalizedName,
			familyRole: input.familyRole ?? FamilyRole.child,
			symbolPubKey: input.symbolPubKey,
		},
		tx,
	);
}
