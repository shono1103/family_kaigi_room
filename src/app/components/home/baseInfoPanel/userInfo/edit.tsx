import type { FormEventHandler } from "react";
import { useMemo, useState } from "react";
import type { userInfoForBaseInfo } from "./types";

const PUBLIC_KEY_REGEX = /^[0-9A-F]{64}$/;

type SymbolCheckState =
	| "idle"
	| "format_invalid"
	| "checking"
	| "exists"
	| "not_found"
	| "unreachable";

type UserInfoEditProps = {
	userInfo: userInfoForBaseInfo;
	onCancel: () => void;
};

export function UserInfoEdit({ userInfo, onCancel }: UserInfoEditProps) {
	const [symbolPubKeyInput, setSymbolPubKeyInput] = useState(
		userInfo?.symbolPubKey ?? "",
	);
	const [symbolCheckState, setSymbolCheckState] = useState<SymbolCheckState>(
		"idle",
	);

	const normalizedSymbolPubKey = useMemo(
		() => symbolPubKeyInput.trim().toUpperCase(),
		[symbolPubKeyInput],
	);
	const isSymbolPubKeyEmpty = normalizedSymbolPubKey.length === 0;
	const isSymbolPubKeyFormatValid =
		isSymbolPubKeyEmpty || PUBLIC_KEY_REGEX.test(normalizedSymbolPubKey);
	const canCheckSymbolAccount =
		!isSymbolPubKeyEmpty && isSymbolPubKeyFormatValid && symbolCheckState !== "checking";
	const canSubmit =
		isSymbolPubKeyEmpty ||
		(symbolCheckState === "exists" && isSymbolPubKeyFormatValid);

	const checkSymbolAccount = async () => {
		if (!canCheckSymbolAccount) {
			return;
		}

		setSymbolCheckState("checking");

		try {
			const response = await fetch(
				`/api/symbol/account-exists?publicKey=${encodeURIComponent(
					normalizedSymbolPubKey,
				)}`,
				{
					method: "GET",
					cache: "no-store",
				},
			);

			if (!response.ok) {
				setSymbolCheckState("unreachable");
				return;
			}

			const data = (await response.json()) as {
				result?: SymbolCheckState;
			};

			if (data.result === "exists" || data.result === "not_found") {
				setSymbolCheckState(data.result);
				return;
			}

			setSymbolCheckState("unreachable");
		} catch {
			setSymbolCheckState("unreachable");
		}
	};

	const handleSymbolPubKeyChange = (value: string) => {
		const nextValue = value.replace(/\s+/g, "").toUpperCase();
		setSymbolPubKeyInput(nextValue);

		if (!nextValue) {
			setSymbolCheckState("idle");
			return;
		}

		if (!PUBLIC_KEY_REGEX.test(nextValue)) {
			setSymbolCheckState("format_invalid");
			return;
		}

		setSymbolCheckState("idle");
	};

	const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
		if (!isSymbolPubKeyFormatValid) {
			event.preventDefault();
			setSymbolCheckState("format_invalid");
			return;
		}

		if (!isSymbolPubKeyEmpty && symbolCheckState !== "exists") {
			event.preventDefault();
			if (symbolCheckState === "idle") {
				setSymbolCheckState("not_found");
			}
		}
	};

	const symbolCheckMessage = (() => {
		if (symbolCheckState === "format_invalid") {
			return "公開鍵は64文字の16進数（0-9, A-F）で入力してください。";
		}
		if (symbolCheckState === "checking") {
			return "Symbolアカウントを確認中です...";
		}
		if (symbolCheckState === "exists") {
			return "存在するアカウントです。";
		}
		if (symbolCheckState === "not_found") {
			return "この公開鍵のSymbolアカウントは見つかりません。";
		}
		if (symbolCheckState === "unreachable") {
			return "ノードに接続できませんでした。時間をおいて再試行してください。";
		}
		return null;
	})();

	const symbolCheckMessageClass =
		symbolCheckState === "exists"
			? "text-emerald-700"
			: symbolCheckState === "checking" || symbolCheckState === "idle"
				? "text-[#4b4b65]"
				: "text-red-600";

	return (
		<>
			<div className="mb-3 flex items-center justify-between gap-2">
				<p className="text-xs font-bold text-[#4b4b65]">
					プロフィール編集
				</p>
				<button
					type="button"
					onClick={onCancel}
					className="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#2b2b3e]"
				>
					表示に戻る
				</button>
			</div>

			<form
				action="/api/user-info"
				method="post"
				className="space-y-3"
				onSubmit={handleSubmit}
			>
				<div className="grid gap-3 sm:grid-cols-2">
					<label className="block sm:col-span-2">
						<span className="mb-2 block text-xs font-bold text-[#2b2b3e]">
							名前
						</span>
						<input
							type="text"
							name="name"
							required
							defaultValue={userInfo?.name ?? ""}
							className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
							placeholder="山田 太郎"
						/>
					</label>
					<label className="block sm:col-span-2">
						<span className="mb-2 block text-xs font-bold text-[#2b2b3e]">
							Symbol Public Key（任意）
						</span>
						<div className="flex flex-wrap gap-2">
							<input
								type="text"
								name="symbolPubKey"
								value={symbolPubKeyInput}
								onChange={(event) =>
									handleSymbolPubKeyChange(event.target.value)
								}
								className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
								placeholder="例: 87DA603E7BE5656C..."
								maxLength={64}
								spellCheck={false}
								autoCapitalize="off"
								autoCorrect="off"
							/>
							<button
								type="button"
								onClick={checkSymbolAccount}
								disabled={!canCheckSymbolAccount}
								className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-[#2b2b3e] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{symbolCheckState === "checking"
									? "確認中..."
									: "存在確認"}
							</button>
						</div>
						{symbolCheckMessage ? (
							<p className={`mt-2 text-xs font-semibold ${symbolCheckMessageClass}`}>
								{symbolCheckMessage}
							</p>
						) : null}
					</label>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						type="submit"
						disabled={!canSubmit}
						className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#2b2b3e] disabled:cursor-not-allowed disabled:opacity-50"
					>
						基本情報を保存
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="cursor-pointer rounded-xl border border-black/10 bg-black/[0.03] px-4 py-2 text-xs font-bold text-[#4b4b65]"
					>
						キャンセル
					</button>
				</div>
			</form>
		</>
	);
}
