import { readUserFamilyByUserId } from "@/lib/db/user/read";
import { getVoiceDetailsByPublicKey } from "@/lib/symbol/useCase/voice/read";

export async function readFamilyVoiceForUser(
	userId: string,
	userSymbolPubKey: string | null | undefined,
) {
	const userWithFamily = await readUserFamilyByUserId(userId);
	const family = userWithFamily?.family ?? null;
	const familyVoice = await getVoiceDetailsByPublicKey(
		userSymbolPubKey ?? "",
		family?.familyVoiceMosaicId ?? "",
	);

	return {
		family,
		familyVoice,
	};
}
