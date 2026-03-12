import { prisma } from "@/lib/prisma";

export type UpdateFamilyInput = Readonly<{
	familyName?: string;
}>;

export async function updateFamily(id: string, input: UpdateFamilyInput) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	const data: {
		familyName?: string;
	} = {};

	if (undefined !== input.familyName) {
		const familyName = input.familyName.trim();
		if (!familyName) {
			throw new Error("familyName must not be empty");
		}
		data.familyName = familyName;
	}

	return prisma.family.update({
		where: {
			id: normalizedId,
		},
		data,
	});
}
