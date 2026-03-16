import { prisma } from "@/lib/prisma";

export type UpdateDiscussionInput = Readonly<{
	title?: string;
	detail?: string;
	authorUserId?: string;
}>;

export async function updateDiscussion(id: string, input: UpdateDiscussionInput) {
	const normalizedId = id.trim();

	if (!normalizedId) {
		throw new Error("id is required");
	}

	const data: {
		title?: string;
		detail?: string;
		authorUserId?: string;
	} = {};

	if (undefined !== input.title) {
		const title = input.title.trim();
		if (!title) {
			throw new Error("title must not be empty");
		}
		data.title = title;
	}

	if (undefined !== input.detail) {
		const detail = input.detail.trim();
		if (!detail) {
			throw new Error("detail must not be empty");
		}
		data.detail = detail;
	}

	if (undefined !== input.authorUserId) {
		const authorUserId = input.authorUserId.trim();
		if (!authorUserId) {
			throw new Error("authorUserId must not be empty");
		}
		data.authorUserId = authorUserId;
	}

	return prisma.discussion.update({
		where: {
			id: normalizedId,
		},
		data,
	});
}
