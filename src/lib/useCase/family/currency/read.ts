import { readUserFamilyByUserId } from "@/lib/db/user/read";
import { getCurrencyDetailsByPublicKey } from "@/lib/symbol/useCase/currency/read";

export async function readFamilyCurrencyForUser(
	userId: string,
	userSymbolPubKey: string | null | undefined,
) {
	const userWithFamily = await readUserFamilyByUserId(userId);
	const family = userWithFamily?.family ?? null;
	const familyCurrency = await getCurrencyDetailsByPublicKey(
		userSymbolPubKey ?? "",
		family?.currencyMosaicId ?? "",
	);

	return {
		family,
		familyCurrency,
	};
}
