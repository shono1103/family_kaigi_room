import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
	parseSymbolPublicKey,
	validateSymbolPublicKey,
} from "@/lib/symbol/account";
import {
	IssueTicketError,
	issueTicketOnChain,
	type TicketOnChainMetadata,
} from "@/lib/symbol/ticketIssue";

const MAX_NAME_LENGTH = 100;
const MAX_DETAIL_LENGTH = 1200;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_METADATA_SIZE_BYTES = 900;

function jsonError(message: string, status: number) {
	return NextResponse.json({ ok: false, message }, { status });
}

function parseBooleanInput(value: FormDataEntryValue | null) {
	if (typeof value !== "string") {
		return false;
	}

	const normalized = value.trim().toLowerCase();
	return normalized === "on" || normalized === "true" || normalized === "1";
}

function isImageFile(value: FormDataEntryValue | null): value is File {
	return value instanceof File && value.size > 0;
}

export async function POST(request: Request) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		return jsonError("ログインが必要です。", 401);
	}

	const formData = await request.formData();
	const name = formData.get("name");
	const detail = formData.get("detail");
	const thumbnailImage = formData.get("thumbnailImage");
	const issuerPrivateKeyInput = formData.get("issuerPrivateKey");
	const isUsed = parseBooleanInput(formData.get("isUsed"));

	if (
		typeof name !== "string" ||
		typeof detail !== "string" ||
		typeof issuerPrivateKeyInput !== "string"
	) {
		return jsonError("入力値が不正です。", 400);
	}

	const normalizedName = name.trim();
	const normalizedDetail = detail.trim();
	const issuerPrivateKey = issuerPrivateKeyInput.trim();
	const userInfo = await prisma.userInfo.findUnique({
		where: { userId: auth.user.id },
		select: { symbolPubKey: true },
	});
	const recipientPublicKey = parseSymbolPublicKey(userInfo?.symbolPubKey);

	if (!normalizedName || normalizedName.length > MAX_NAME_LENGTH) {
		return jsonError("名称は1〜100文字で入力してください。", 400);
	}

	if (!normalizedDetail || normalizedDetail.length > MAX_DETAIL_LENGTH) {
		return jsonError("詳細は1〜1200文字で入力してください。", 400);
	}

	if (!issuerPrivateKey) {
		return jsonError("秘密鍵を入力してください。", 400);
	}
	if (!recipientPublicKey || !validateSymbolPublicKey(recipientPublicKey)) {
		return jsonError(
			"基本情報のSymbol公開鍵が未設定または不正です。先に設定してください。",
			400,
		);
	}

	if (!isImageFile(thumbnailImage)) {
		return jsonError("サムネイル画像を選択してください。", 400);
	}

	if (!thumbnailImage.type.startsWith("image/")) {
		return jsonError("サムネイル画像は画像ファイルのみ指定できます。", 400);
	}

	if (thumbnailImage.size > MAX_IMAGE_SIZE_BYTES) {
		return jsonError("サムネイル画像は2MB以下にしてください。", 400);
	}

	const imageBuffer = Buffer.from(await thumbnailImage.arrayBuffer());
	const thumbnailSha256 = createHash("sha256")
		.update(imageBuffer)
		.digest("hex")
		.toUpperCase();

	const metadata: TicketOnChainMetadata = {
		name: normalizedName,
		detail: normalizedDetail,
		isUsed,
		thumbnail: {
			filename: thumbnailImage.name,
			mimeType: thumbnailImage.type,
			size: thumbnailImage.size,
			sha256: thumbnailSha256,
		},
	};

	const metadataSize = new TextEncoder().encode(JSON.stringify(metadata)).length;
	if (metadataSize > MAX_METADATA_SIZE_BYTES) {
		return jsonError(
			"入力データが大きすぎます。詳細文を短くするか画像サイズを下げてください。",
			400,
		);
	}

	try {
		const issued = await issueTicketOnChain(metadata, {
			issuerPrivateKey,
			recipientPublicKey,
		});
		return NextResponse.json({
			ok: true,
			mosaicId: issued.mosaicId,
			transactionHash: issued.transactionHash,
			announcedNodeUrl: issued.announcedNodeUrl,
			issuerPublicKey: issued.issuerPublicKey,
		});
	} catch (error) {
		if (error instanceof IssueTicketError) {
			if (error.code === "issuer_private_key_missing") {
				return jsonError(
					"秘密鍵の形式が不正です。64桁16進数を入力してください。",
					400,
				);
			}
			if (error.code === "node_unreachable") {
				return jsonError(
					"Symbolノード設定が不正です。接続先を確認してください。",
					503,
				);
			}
			return jsonError(
				"オンチェーン発行に失敗しました。時間を置いて再試行してください。",
				502,
			);
		}

		return jsonError("予期しないエラーが発生しました。", 500);
	}
}
