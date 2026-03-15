import { getMosaic } from '../../utils/node-client';
import { normalizeMosaicIdHex, normalizeSymbolPublicKey } from '../../utils/normalizers';
import { readAccountOwnedMosaicsByPublicKey } from '../account/read';
import { nodeUrl } from '../../config';

type VoiceOwnershipStatus = 'owned' | 'not_owned';

type GetVoiceDetailsSuccess = Readonly<{
	ok: true;
	status: 'ok';
	publicKey: string;
	mosaicIdHex: string;
	ownershipStatus: VoiceOwnershipStatus;
	amountRaw: string;
	mosaic: Awaited<ReturnType<typeof getMosaic>>['mosaic'];
}>;

type GetVoiceDetailsFailure = Readonly<{
	ok: false;
	status:
		| 'invalid_public_key'
		| 'invalid_mosaic_id'
		| 'account_not_found'
		| 'node_unreachable'
		| 'read_failed';
	message: string;
}>;

export type GetVoiceDetailsResult =
	| GetVoiceDetailsSuccess
	| GetVoiceDetailsFailure;

export const getVoiceDetailsByPublicKey = async (
	rawPublicKey: string,
	rawMosaicIdHex: string
): Promise<GetVoiceDetailsResult> => {
	const publicKey = normalizeSymbolPublicKey(rawPublicKey);
	if (!publicKey) {
		return {
			ok: false,
			status: 'invalid_public_key',
			message: 'publicKey must be a 64-character hex string.'
		};
	}

	let mosaicIdHex: string;
	try {
		mosaicIdHex = normalizeMosaicIdHex(rawMosaicIdHex);
		if (!/^[0-9A-F]{16}$/.test(mosaicIdHex)) {
			throw new Error('invalid mosaic id');
		}
	} catch {
		return {
			ok: false,
			status: 'invalid_mosaic_id',
			message: 'mosaicIdHex must be a 16-character hex string with optional 0x prefix.'
		};
	}

	try {
		const ownedMosaicsResult = await readAccountOwnedMosaicsByPublicKey(publicKey);
		if (!ownedMosaicsResult.ok) {
			return {
				ok: false,
				status:
					ownedMosaicsResult.status === 'invalid_public_key'
						? 'invalid_public_key'
						: ownedMosaicsResult.status === 'account_not_found'
							? 'account_not_found'
							: ownedMosaicsResult.status === 'node_unreachable'
								? 'node_unreachable'
								: 'read_failed',
				message: ownedMosaicsResult.message
			};
		}

		const mosaicResult = await getMosaic(nodeUrl, mosaicIdHex);
		const ownedMosaic = ownedMosaicsResult.mosaics.find(
			(mosaic) => mosaic.mosaicIdHex === mosaicIdHex
		);

		return {
			ok: true,
			status: 'ok',
			publicKey,
			mosaicIdHex: `0x${mosaicIdHex}`,
			ownershipStatus: ownedMosaic ? 'owned' : 'not_owned',
			amountRaw: ownedMosaic?.amountRaw ?? '0',
			mosaic: mosaicResult.mosaic
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const status = message.includes('mainnet-node.invalid') || message.includes('testnet-node.invalid')
			? 'node_unreachable'
			: 'read_failed';
		return {
			ok: false,
			status,
			message
		};
	}
};
