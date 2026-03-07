import { PrivateKey, PublicKey } from 'symbol-sdk';
import { SymbolAccount, SymbolFacade, SymbolPublicAccount } from 'symbol-sdk/symbol';


export const createNewSymbolAccount = (
	facade: SymbolFacade,
): SymbolAccount => {
	const privateKey = PrivateKey.random();
	const account = facade.createAccount(privateKey);
	return account
}

export const generateAccountFromPrivateKey = (
	facade: SymbolFacade,
	key: string
): SymbolAccount => {
	const privateKey = new PrivateKey(key);
	const account = facade.createAccount(privateKey);
	return account

}

export const generateAccountFromPublicKey = (
	facade: SymbolFacade,
	key: string
): SymbolPublicAccount => {
	const publicKey = new PublicKey(key);
	const account = facade.createPublicAccount(publicKey);
	return account
}
