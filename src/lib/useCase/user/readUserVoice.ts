import { readUserFamilyByUserId } from "@/lib/db/user/read";
import { readUserInfoByUserId } from "@/lib/db/userInfo/read";
import { readAccountOwnedMosaicsByPublicKey } from "@/lib/symbol/useCase/account/read";

type UserVoiceOwnershipStatus = "owned" | "not_owned";

type ReadUserVoiceSuccess = Readonly<{
	ok: true;
	status: "ok";
	userId: string;
	publicKey: string | null;
	familyVoiceMosaicId: string;
	ownershipStatus: UserVoiceOwnershipStatus;
	amountRaw: string;
}>;

type ReadUserVoiceFailure = Readonly<{
	ok: false;
	status:
		| "user_not_found"
		| "family_not_found"
		| "invalid_family_voice_mosaic_id"
		| "invalid_public_key"
		| "node_unreachable"
		| "read_failed";
	message: string;
}>;

export type ReadUserVoiceResult = Readonly<
	ReadUserVoiceSuccess | ReadUserVoiceFailure
>;

export async function readUserVoice(
	userId: string,
): Promise<ReadUserVoiceResult> {
	const normalizedUserId = userId.trim();

	if (!normalizedUserId) {
		throw new Error("userId is required");
	}

	const [userWithFamily, userInfo] = await Promise.all([
		readUserFamilyByUserId(normalizedUserId),
		readUserInfoByUserId(normalizedUserId),
	]);

	if (!userWithFamily) {
		return {
			ok: false,
			status: "user_not_found",
			message: "user was not found",
		};
	}

	const family = userWithFamily.family;
	if (!family) {
		return {
			ok: false,
			status: "family_not_found",
			message: "family was not found",
		};
	}

	const familyVoiceMosaicId = family.familyVoiceMosaicId?.trim().toUpperCase();
	if (!familyVoiceMosaicId) {
		return {
			ok: false,
			status: "invalid_family_voice_mosaic_id",
			message: "familyVoiceMosaicId is required",
		};
	}

	const publicKey = userInfo?.symbolPubKey ?? null;
	if (!publicKey) {
		return {
			ok: true,
			status: "ok",
			userId: normalizedUserId,
			publicKey: null,
			familyVoiceMosaicId,
			ownershipStatus: "not_owned",
			amountRaw: "0",
		};
	}

	const ownedMosaicsResult = await readAccountOwnedMosaicsByPublicKey(publicKey);
	if (!ownedMosaicsResult.ok) {
		if (ownedMosaicsResult.status === "account_not_found") {
			return {
				ok: true,
				status: "ok",
				userId: normalizedUserId,
				publicKey,
				familyVoiceMosaicId,
				ownershipStatus: "not_owned",
				amountRaw: "0",
			};
		}

		return {
			ok: false,
			status:
				ownedMosaicsResult.status === "invalid_public_key"
					? "invalid_public_key"
					: ownedMosaicsResult.status === "node_unreachable"
						? "node_unreachable"
						: "read_failed",
			message: ownedMosaicsResult.message,
		};
	}

	const ownedMosaic = ownedMosaicsResult.mosaics.find(
		(mosaic) => mosaic.mosaicIdHex === familyVoiceMosaicId,
	);

	return {
		ok: true,
		status: "ok",
		userId: normalizedUserId,
		publicKey,
		familyVoiceMosaicId,
		ownershipStatus: ownedMosaic ? "owned" : "not_owned",
		amountRaw: ownedMosaic?.amountRaw ?? "0",
	};
}
