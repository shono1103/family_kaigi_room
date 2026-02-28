"use client";

import { useState } from "react";
import { UserPasswordEdit } from "./password/edit";
import type { UserEditProps } from "./types";

export function UserEdit({ userEmail, onCancel }: UserEditProps) {
	const [isPasswordEditOpen, setIsPasswordEditOpen] = useState(false);

	return (
		<>
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm text-[#4b4b65]">ログイン中ユーザー</p>
				<button
					type="button"
					onClick={onCancel}
					className="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#2b2b3e]"
				>
					表示に戻る
				</button>
			</div>
			<p className="mt-1 break-all text-base font-semibold text-[#202033]">
				{userEmail}
			</p>

			<form action="/auth/email" method="post" className="mt-4 space-y-3">
				<label className="block">
					<span className="mb-2 block text-xs font-bold text-[#2b2b3e]">
						メールアドレス
					</span>
					<input
						type="email"
						name="email"
						autoComplete="email"
						required
						className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
						placeholder="user@example.com"
						defaultValue={userEmail}
					/>
				</label>
				<div className="flex flex-wrap gap-2">
					<button
						type="submit"
						className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#2b2b3e]"
					>
						メールアドレスを更新
					</button>
					<button
						type="button"
						onClick={() => setIsPasswordEditOpen((prev) => !prev)}
						className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#2b2b3e]"
					>
						{isPasswordEditOpen
							? "パスワード変更を閉じる"
							: "パスワード変更"}
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

			{isPasswordEditOpen ? (
				<UserPasswordEdit
					onCancel={() => setIsPasswordEditOpen(false)}
				/>
			) : null}
		</>
	);
}
