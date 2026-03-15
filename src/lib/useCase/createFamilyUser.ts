import type { Prisma } from "@prisma/client";
import { FamilyRole, UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { createUser, type CreateUserInput } from "@/lib/db/user/create";
import { createUserInfo, type CreateUserInfoInput } from "@/lib/db/userInfo/create";
import { readUserByEmail, readUserById } from "@/lib/db/user/read";
import { prisma } from "@/lib/prisma";

export type CreateFamilyUserInput = Readonly<{
	requesterUserId: string;
	email: CreateUserInput["email"];
	name: CreateUserInfoInput["name"];
	familyRole: FamilyRole;
}>;

export type CreateFamilyUserResult = Readonly<{
	user: Awaited<ReturnType<typeof createUser>>;
	initialPassword: string;
}>;

export async function createFamilyUser(
	input: CreateFamilyUserInput,
): Promise<CreateFamilyUserResult> {
	const requesterUserId = input.requesterUserId.trim();
	const email = input.email.trim().toLowerCase();
	const name = input.name.trim();

	if (!requesterUserId) {
		throw new Error("requesterUserId is required");
	}

	if (!email) {
		throw new Error("email is required");
	}

	if (!name) {
		throw new Error("name is required");
	}

	const requester = await readUserById(requesterUserId);
	if (!requester) {
		throw new Error("requesterUser was not found");
	}

	if (!requester.isFamilyOwner) {
		throw new Error("only family owner can create family user");
	}

	const existingUser = await readUserByEmail(email);
	if (existingUser) {
		throw new Error("email is already in use");
	}

	const initialPassword = email;
	const passwordHash = hashPassword(initialPassword);

	const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const createdUser = await createUser(
			{
				email,
				passwordHash,
				familyId: requester.familyId,
				isFamilyOwner: false,
				isFirst: true,
				role: UserRole.normal,
			},
			tx,
		);

		await createUserInfo(
			{
				userId: createdUser.id,
				name,
				familyRole: input.familyRole,
			},
			tx,
		);

		return createdUser;
	});

	return {
		user,
		initialPassword,
	};
}
