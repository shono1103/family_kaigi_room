"use client";

import { useState } from "react";

type FamilyUserAddPanelProps = {
};

type AddFamilyUserResponse = {
	ok: boolean;
	message?: string;
	initialPassword?: string;
	user?: {
		id: string;
		email: string;
	};
};

export function FamilyUserAddPanel({}: FamilyUserAddPanelProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

	return (
		<div className="mt-4 rounded-xl border border-black/10 bg-white/50 p-3">
			<div className="mb-3 flex items-center justify-between gap-2">
				<p className="text-xs font-bold text-[#4b4b65]">家族ユーザー追加</p>
			</div>

			<form
				className="space-y-3"
				onSubmit={async (event) => {
					event.preventDefault();
					const form = event.currentTarget;
					const formData = new FormData(form);
					setSubmitError(null);
					setSubmitSuccess(null);
					setIsSubmitting(true);

					try {
						const response = await fetch("/api/family-user", {
							method: "POST",
							body: formData,
						});
						const result = (await response.json()) as AddFamilyUserResponse;

						if (!response.ok || !result.ok) {
							setSubmitError(
								result.message ??
									"家族ユーザーの作成に失敗しました。時間をおいて再試行してください。",
							);
							return;
						}

						setSubmitSuccess(
							result.user?.email && result.initialPassword
								? `ユーザー ${result.user.email} を作成しました。初期パスワード: ${result.initialPassword}`
								: "家族ユーザーを作成しました。",
						);
						form.reset();
					} catch {
						setSubmitError("通信エラーが発生しました。接続状態を確認してください。");
					} finally {
						setIsSubmitting(false);
					}
				}}
			>
				<label className="block">
					<span className="mb-2 block text-xs font-bold text-[#2b2b3e]">
						新規ユーザーのメールアドレス
					</span>
					<input
						type="email"
						name="email"
						required
						autoComplete="email"
						className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
						placeholder="new-user@example.com"
					/>
				</label>
				<p className="text-xs font-semibold text-[#4b4b65]">
					初期パスワードは入力したメールアドレスになります。初回ログイン時に再設定します。
				</p>

				<div className="flex flex-wrap gap-2">
					<button
						type="submit"
						disabled={isSubmitting}
						className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#2b2b3e] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? "作成中..." : "家族ユーザーを作成"}
					</button>
				</div>
			</form>

			{submitSuccess ? (
				<p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
					{submitSuccess}
				</p>
			) : null}
			{submitError ? (
				<p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
					{submitError}
				</p>
			) : null}
		</div>
	);
}
