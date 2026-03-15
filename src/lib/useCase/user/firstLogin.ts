import { FamilyRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { createSymbolAccount } from "@/lib/symbol/useCase/account/create";
import { sendVoiceOnChain } from "@/lib/symbol/useCase/voice/send";
const INITIAL_USER_FAMILY_VOICE_AMOUNT_RAW = 10n;

export type CompleteFirstLoginInput = Readonly<{
	userId: string;
	newPassword: string;
	newPasswordConfirm: string;
}>;

export type CompleteFirstLoginResult =
	| Readonly<{
			ok: true;
			symbolAccount: {
				address: string;
				publicKey: string;
				privateKey: string;
			};
	  }>
	| Readonly<{
			ok: false;
			error:
				| "invalid_request"
				| "password_mismatch"
				| "setup_failed";
	  }>;

export async function completeFirstLogin(
	input: CompleteFirstLoginInput,
): Promise<CompleteFirstLoginResult> {
	const userId = input.userId.trim();

	if (!userId || !input.newPassword || !input.newPasswordConfirm) {
		return {
			ok: false,
			error: "invalid_request",
		};
	}

	if (input.newPassword !== input.newPasswordConfirm) {
		return {
			ok: false,
			error: "password_mismatch",
		};
	}

	try {
		const symbolAccount = createSymbolAccount();
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				email: true,
				family: {
					select: {
						symbolPrivKey: true,
						familyVoiceMosaicId: true,
					},
				},
				userInfo: {
					select: {
						name: true,
					},
				},
			},
		});

		const normalizedName =
			user?.userInfo?.name?.trim() ||
			user?.email.split("@")[0]?.trim() ||
			"";
		const familySymbolPrivKey = user?.family?.symbolPrivKey?.trim();
		const familyVoiceMosaicId = user?.family?.familyVoiceMosaicId?.trim();
		if (!normalizedName || !familySymbolPrivKey || !familyVoiceMosaicId) {
			return {
				ok: false,
				error: "setup_failed",
			};
		}

		const sendVoiceResult = await sendVoiceOnChain(
			familySymbolPrivKey,
			symbolAccount.publicKey,
			familyVoiceMosaicId,
			INITIAL_USER_FAMILY_VOICE_AMOUNT_RAW,
			"Initial family voice grant",
		);
		if (!sendVoiceResult.ok) {
			console.error(
				"[usecase:user:firstLogin] failed to grant initial family voice",
				sendVoiceResult,
			);
			return {
				ok: false,
				error: "setup_failed",
			};
		}

		await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: userId },
				data: {
					passwordHash: hashPassword(input.newPassword),
					isFirst: false,
				},
			});

			await tx.userInfo.upsert({
				where: { userId },
				create: {
					userId,
					name: normalizedName,
					symbolPubKey: symbolAccount.publicKey,
					familyRole: FamilyRole.child,
				},
				update: {
					name: normalizedName,
					symbolPubKey: symbolAccount.publicKey,
				},
			});
		});

		return {
			ok: true,
			symbolAccount,
		};
	} catch (error) {
		console.error("[usecase:user:firstLogin] failed to complete first login", error);
		return {
			ok: false,
			error: "setup_failed",
		};
	}
}
