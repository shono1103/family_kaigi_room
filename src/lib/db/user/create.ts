import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateUserInput = Readonly<{
	email: string;
	passwordHash: string;
	familyId: string;
	isFamilyOwner?: boolean;
	role?: UserRole;
}>;

export async function createUser(input: CreateUserInput) {
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

	return prisma.user.create({
		data: {
			email,
			passwordHash,
			familyId,
			isFamilyOwner: input.isFamilyOwner ?? false,
			role: input.role ?? UserRole.normal,
		},
	});
}
