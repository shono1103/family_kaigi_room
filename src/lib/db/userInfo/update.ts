import { FamilyRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UpdateUserInfoInput = Readonly<{
	name?: string;
	familyRole?: FamilyRole;
	symbolPubKey?: string | null;
}>;

export async function updateUserInfo(userId: string, input: UpdateUserInfoInput) {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	const data: {
		name?: string;
		familyRole?: FamilyRole;
		symbolPubKey?: string | null;
	} = {};

	if (undefined !== input.name) {
		const name = input.name.trim();
		if (!name) {
			throw new Error("name must not be empty");
		}
		data.name = name;
	}

	if (undefined !== input.familyRole) {
		data.familyRole = input.familyRole;
	}

	if (undefined !== input.symbolPubKey) {
		data.symbolPubKey = input.symbolPubKey?.trim() || null;
	}

	return prisma.userInfo.update({
		where: {
			userId: normalizedUserId,
		},
		data,
	});
}
