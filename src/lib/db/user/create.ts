import type { Prisma, PrismaClient } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateUserInput = Readonly<{
	email: string;
	passwordHash: string;
	familyId: string;
	isFamilyOwner?: boolean;
	role?: UserRole;
}>;

type UserDbClient = PrismaClient | Prisma.TransactionClient;

export async function createUser(
	input: CreateUserInput,
	db: UserDbClient = prisma,
) {
	const email = input.email.trim().toLowerCase();
	const passwordHash = input.passwordHash.trim();
	const familyId = input.familyId.trim();

	if (!email) {
		throw new Error("email is required");
	}

	if (!passwordHash) {
		throw new Error("passwordHash is required");
	}

	if (!familyId) {
		throw new Error("familyId is required");
	}

	return db.user.create({
		data: {
			email,
			passwordHash,
			familyId,
			isFamilyOwner: input.isFamilyOwner ?? false,
			role: input.role ?? UserRole.normal,
		},
	});
}
