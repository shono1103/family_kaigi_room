import type { Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { createUser, type CreateUserInput } from "@/lib/db/user/create";

export type RegisterFamilyUserInput = Readonly<{
	email: CreateUserInput["email"];
	passwordHash: CreateUserInput["passwordHash"];
	familyId: CreateUserInput["familyId"];
	isFamilyOwner?: CreateUserInput["isFamilyOwner"];
}>;

export async function registerFamilyUser(
	input: RegisterFamilyUserInput,
	tx: Prisma.TransactionClient,
) {
	return createUser(
		{
			email: input.email,
			passwordHash: input.passwordHash,
			familyId: input.familyId,
			isFamilyOwner: input.isFamilyOwner ?? false,
			role: UserRole.normal,
		},
		tx,
	);
}
