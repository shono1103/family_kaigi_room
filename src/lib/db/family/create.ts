import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
	normalizeMosaicIdHex,
	normalizeSymbolPublicKey,
	normalizeSymbolPrivateKey,
} from "@/lib/symbol/utils/normalizers";

export type CreateFamilyInput = Readonly<{
	familyName: string;
	familyVoiceMosaicId: string;
	symbolPubKey?: string | null;
	symbolPrivKey?: string | null;
}>;

type FamilyDbClient = PrismaClient | Prisma.TransactionClient;

export async function createFamily(
	input: CreateFamilyInput,
	db: FamilyDbClient = prisma,
) {
	const familyName = input.familyName.trim();
	const familyVoiceMosaicId = normalizeMosaicIdHex(input.familyVoiceMosaicId);
	const symbolPubKey = normalizeSymbolPublicKey(input.symbolPubKey);
	const symbolPrivKey = normalizeSymbolPrivateKey(input.symbolPrivKey);

	if (!familyName) {
		throw new Error("familyName is required");
	}

	if (!familyVoiceMosaicId) {
		throw new Error("familyVoiceMosaicId is required");
	}

	if (!/^[0-9A-F]{16}$/.test(familyVoiceMosaicId)) {
		throw new Error(
			"familyVoiceMosaicId must be a 16-character hex string with optional 0x prefix",
		);
	}

	if (input.symbolPubKey && !symbolPubKey) {
		throw new Error("symbolPubKey must be a 64-character hex string");
	}

	if (input.symbolPrivKey && !symbolPrivKey) {
		throw new Error("symbolPrivKey must be a 64-character hex string");
	}

	return db.family.create({
		data: {
			familyName,
			familyVoiceMosaicId,
			symbolPubKey,
			symbolPrivKey,
		},
	});
}
