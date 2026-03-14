import type { Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { createUser, type CreateUserInput } from "@/lib/db/user/create";
import { readUserByEmail, readUserById } from "@/lib/db/user/read";
import { prisma } from "@/lib/prisma";

export type AddUserInput = Readonly<{
	requesterUserId: string;
	email: CreateUserInput["email"];
}>;

export type AddUserResult = Readonly<{
	user: Awaited<ReturnType<typeof createUser>>;
	initialPassword: string;
}>;

export async function addUser(input: AddUserInput): Promise<AddUserResult> {
	const requesterUserId = input.requesterUserId.trim();
	const email = input.email.trim().toLowerCase();

	if (!requesterUserId) {
		throw new Error("requesterUserId is required");
	}

	if (!email) {
		throw new Error("email is required");
	}

	const requester = await readUserById(requesterUserId);
	if (!requester) {
		throw new Error("requesterUser was not found");
	}

	if (!requester.isFamilyOwner) {
		throw new Error("only family owner can add user");
	}

	const existingUser = await readUserByEmail(email);
	if (existingUser) {
		throw new Error("email is already in use");
	}

	const initialPassword = email;
	const passwordHash = hashPassword(initialPassword);

	const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) =>
		createUser(
			{
				email,
				passwordHash,
				familyId: requester.familyId,
				isFamilyOwner: false,
				role: UserRole.normal,
			},
			tx,
		),
	);

	return {
		user,
		initialPassword,
	};
}
