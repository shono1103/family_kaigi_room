"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type PasswordFormProps = {
	initialErrorMessage: string | null;
};

type FirstLoginResponse = {
	ok: boolean;
	error?: string;
	redirectTo?: string;
	symbolAccount?: {
		address: string;
		publicKey: string;
		privateKey: string;
	};
};

const errorMessageMap: Record<string, string> = {
	invalid_request: "入力内容が不正です。",
	password_mismatch: "パスワード確認が一致しません。",
	setup_failed: "初回設定の完了に失敗しました。時間をおいて再試行してください。",
};

export function PasswordForm({ initialErrorMessage }: PasswordFormProps) {
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);
		setIsSubmitting(true);

		try {
			const formData = new FormData(event.currentTarget);
			const response = await fetch("/api/auth/first-login", {
				method: "POST",
				body: formData,
			});
			const result = (await response.json()) as FirstLoginResponse;

			if (!response.ok || !result.ok) {
				if (result.redirectTo) {
					router.push(result.redirectTo);
					router.refresh();
					return;
				}
				setErrorMessage(
					result.error
						? (errorMessageMap[result.error] ?? "初回設定に失敗しました。")
						: "初回設定に失敗しました。",
				);
				return;
			}

			if (result.symbolAccount) {
				sessionStorage.setItem(
					"first_login_symbol_account",
					JSON.stringify(result.symbolAccount),
				);
			}
			router.push("/first-login/symbolAccountReview");
		} catch {
			setErrorMessage("通信エラーが発生しました。接続状態を確認してください。");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			{errorMessage ? (
				<p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
					{errorMessage}
				</p>
			) : null}

			<form onSubmit={handleSubmit} className="mt-6 space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<label className="block">
						<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
							新しいパスワード
						</span>
						<input
							type="password"
							name="newPassword"
							autoComplete="new-password"
							required
							className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition"
							placeholder="新しいパスワード"
						/>
					</label>
					<label className="block">
						<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
							新しいパスワード（確認）
						</span>
						<input
							type="password"
							name="newPasswordConfirm"
							autoComplete="new-password"
							required
							className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition"
							placeholder="確認用パスワード"
						/>
					</label>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="rounded-xl bg-[#1e1e2a] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSubmitting ? "初回設定を完了中..." : "初回設定を完了する"}
				</button>
			</form>
		</>
	);
}
