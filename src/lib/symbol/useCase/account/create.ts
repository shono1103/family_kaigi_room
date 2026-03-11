import { PrivateKey } from "symbol-sdk";
import { facade } from "@/lib/symbol/config";

export type CreateSymbolAccountResult = Readonly<{
	publicKey: string;
	privateKey: string;
}>;

export function createSymbolAccount(): CreateSymbolAccountResult {
	const privateKey = PrivateKey.random();
	const account = facade.createAccount(privateKey);

	return {
		publicKey: account.publicKey.toString(),
		privateKey: privateKey.toString(),
	};
}
