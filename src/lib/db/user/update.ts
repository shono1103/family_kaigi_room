import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UpdateUserInput = Readonly<{
	email?: string;
	passwordHash?: string;
	familyId?: string;
	isFamilyOwner?: boolean;
	isFirst?: boolean;
	role?: UserRole;
}>;

export async function updateUser(id: string, input: UpdateUserInput) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	const data: {
		email?: string;
		passwordHash?: string;
		familyId?: string;
		isFamilyOwner?: boolean;
		isFirst?: boolean;
		role?: UserRole;
	} = {};

	if (undefined !== input.email) {
		const email = input.email.trim().toLowerCase();
		if (!email) {
			throw new Error("email must not be empty");
		}
		data.email = email;
	}

	if (undefined !== input.passwordHash) {
		const passwordHash = input.passwordHash.trim();
		if (!passwordHash) {
			throw new Error("passwordHash must not be empty");
		}
		data.passwordHash = passwordHash;
	}

	if (undefined !== input.familyId) {
		const familyId = input.familyId.trim();
		if (!familyId) {
			throw new Error("familyId must not be empty");
		}
		data.familyId = familyId;
	}

	if (undefined !== input.isFamilyOwner) {
		data.isFamilyOwner = input.isFamilyOwner;
	}

	if (undefined !== input.isFirst) {
		data.isFirst = input.isFirst;
	}

	if (undefined !== input.role) {
		data.role = input.role;
	}

	return prisma.user.update({
		where: {
			id: normalizedId,
		},
		data,
	});
}
