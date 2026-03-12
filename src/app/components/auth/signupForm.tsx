"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AuthErrorMessage } from "./authErrorMessage";
import { SignupPendingStatus } from "./signupPendingStatus";

type SignupFormProps = {
	errorMessage: string | null;
};

export function SignupForm({ errorMessage }: SignupFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
		null,
	);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setSubmitErrorMessage(null);

		const form = event.currentTarget;
		const formData = new FormData(form);

		try {
			const response = await fetch(form.action, {
				method: form.method,
				body: formData,
				credentials: "same-origin",
				redirect: "follow",
			});

			window.location.assign(response.url);
		} catch (error) {
			console.error("[auth:signup] failed to submit signup form", error);
			setIsSubmitting(false);
			setSubmitErrorMessage(
				"家族会議室の作成開始に失敗しました。時間を置いて再試行してください。",
			);
		}
	}

	if (isSubmitting) {
		return <SignupPendingStatus />;
	}

	return (
		<form
			action="/api/auth/register"
			method="post"
			className="mt-6 space-y-4"
			onSubmit={handleSubmit}
		>
			<label className="block">
				<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
					家族名
				</span>
					<input
						type="text"
						name="familyName"
						autoComplete="organization"
						required
						className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
						placeholder="例: 山田家"
					/>
			</label>

			<label className="block">
				<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
					メールアドレス
				</span>
					<input
						type="email"
						name="email"
						autoComplete="email"
						required
						className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
						placeholder="user@example.com"
					/>
			</label>

			<label className="block">
				<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
					パスワード
				</span>
					<input
						type="password"
						name="password"
						autoComplete="new-password"
						required
						className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#ff4fa3] focus:shadow-[0_0_0_4px_rgba(255,79,163,0.12)]"
						placeholder="••••••••"
					/>
			</label>

			<label className="block">
				<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
					パスワード（確認）
				</span>
					<input
						type="password"
						name="passwordConfirm"
						autoComplete="new-password"
						required
						className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#ff4fa3] focus:shadow-[0_0_0_4px_rgba(255,79,163,0.12)]"
						placeholder="••••••••"
					/>
			</label>

			<label className="block">
				<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
					Symbol秘密鍵
				</span>
					<input
						type="password"
						name="userSymbolPrivKey"
						autoComplete="off"
						required
						className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#ff8b3d] focus:shadow-[0_0_0_4px_rgba(255,139,61,0.12)]"
						placeholder="64桁16進"
					/>
			</label>

			<AuthErrorMessage message={submitErrorMessage ?? errorMessage} />

			<button
				type="submit"
				className="w-full cursor-pointer rounded-2xl bg-[#1e1e2a] px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(20,15,45,0.18)] transition hover:opacity-92"
			>
				新規家族会議室作成
			</button>
		</form>
	);
}
