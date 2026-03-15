import { models } from 'symbol-sdk/symbol';
import { deadlineHours, facade, feeMultiplier, nodeUrl } from '../../config';
import { generateAccountFromPrivateKey, generateAccountFromPublicKey } from '../../utils/accounts';
import { announceTransaction, pollTransactionState } from '../../utils/node-client';
import {
	isValidSymbolPublicKey,
	normalizeMosaicIdHex,
	normalizeSymbolPublicKey,
} from '../../utils/normalizers';

export type SendVoiceOnChainResult =
	| Readonly<{
			ok: true;
			status: 'ok';
			transactionHash: string;
			recipientAddress: string;
			mosaicIdHex: string;
			amountRaw: string;
	  }>
	| Readonly<{
			ok: false;
			status:
				| 'invalid_sender_private_key'
				| 'invalid_recipient_public_key'
				| 'invalid_mosaic_id'
				| 'invalid_amount'
				| 'node_unreachable'
				| 'announce_failed'
				| 'timeout'
				| 'send_failed';
			message: string;
	  }>;

export const sendVoiceOnChain = async (
	senderPrivateKey: string,
	recipientPublicKey: string,
	mosaicIdHex: string,
	amountRaw: bigint,
	message = '',
): Promise<SendVoiceOnChainResult> => {
	if (amountRaw <= 0n) {
		return {
			ok: false,
			status: 'invalid_amount',
			message: 'amountRaw must be greater than 0.',
		};
	}

	const normalizedRecipientPublicKey = normalizeSymbolPublicKey(recipientPublicKey);
	if (
		!normalizedRecipientPublicKey ||
		!isValidSymbolPublicKey(normalizedRecipientPublicKey)
	) {
		return {
			ok: false,
			status: 'invalid_recipient_public_key',
			message: 'recipientPublicKey must be a 64-character hex string.',
		};
	}

	let normalizedMosaicId: string;
	try {
		normalizedMosaicId = normalizeMosaicIdHex(mosaicIdHex);
		if (!/^[0-9A-F]{16}$/.test(normalizedMosaicId)) {
			throw new Error('invalid mosaic id');
		}
	} catch {
		return {
			ok: false,
			status: 'invalid_mosaic_id',
			message: 'mosaicIdHex must be a 16-character hex string with optional 0x prefix.',
		};
	}

	let senderAccount;
	try {
		senderAccount = generateAccountFromPrivateKey(facade, senderPrivateKey);
	} catch (error) {
		const messageText = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			status: 'invalid_sender_private_key',
			message: messageText,
		};
	}

	try {
		const recipientAccount = generateAccountFromPublicKey(
			facade,
			normalizedRecipientPublicKey,
		);
		const transactionDescriptor: Record<string, unknown> = {
			type: 'transfer_transaction_v1',
			signerPublicKey: senderAccount.publicKey,
			fee: 0n,
			deadline: facade.now().addHours(deadlineHours).timestamp,
			recipientAddress: recipientAccount.address,
			mosaics: [{ mosaicId: BigInt(`0x${normalizedMosaicId}`), amount: amountRaw }],
		};
		if (message) {
			transactionDescriptor.message = message;
		}

		const transaction = facade.transactionFactory.create(transactionDescriptor);
		transaction.fee = new models.Amount(
			BigInt(transaction.size) * BigInt(feeMultiplier),
		);

		const signature = senderAccount.signTransaction(transaction);
		const payloadJson = facade.transactionFactory.static.attachSignature(
			transaction,
			signature,
		);
		const hash = facade.hashTransaction(transaction).toString();

		const announceResult = await announceTransaction(nodeUrl, payloadJson);
		if (!announceResult.ok) {
			return {
				ok: false,
				status: 'network_error' === announceResult.error ? 'node_unreachable' : 'announce_failed',
				message: announceResult.message,
			};
		}

		const state = await pollTransactionState(nodeUrl, hash);
		if ('confirmed' === state.state) {
			return {
				ok: true,
				status: 'ok',
				transactionHash: hash,
				recipientAddress: recipientAccount.address.toString(),
				mosaicIdHex: `0x${normalizedMosaicId}`,
				amountRaw: amountRaw.toString(),
			};
		}

		if ('failed' === state.state) {
			const errorCode =
				typeof state.status.code === 'string' && state.status.code
					? state.status.code
					: 'unknown_error';
			return {
				ok: false,
				status: 'announce_failed',
				message: `Transaction failed: ${errorCode}`,
			};
		}

		return {
			ok: false,
			status: 'timeout',
			message: 'Transaction confirmation timeout',
		};
	} catch (error) {
		const messageText = error instanceof Error ? error.message : String(error);
		return {
			ok: false,
			status: 'send_failed',
			message: messageText,
		};
	}
};
