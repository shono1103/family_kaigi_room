type UserPasswordEditProps = {
	onCancel: () => void;
};

export function UserPasswordEdit({ onCancel }: UserPasswordEditProps) {
	return (
		<div className="mt-4 rounded-xl border border-black/10 bg-white/70 p-3">
			<div className="mb-3 flex items-center justify-between gap-2">
				<p className="text-xs font-bold text-[#4b4b65]">
					パスワード変更
				</p>
				<button
					type="button"
					onClick={onCancel}
					className="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#2b2b3e]"
				>
					閉じる
				</button>
			</div>

			<form action="/api/auth/password" method="post" className="space-y-3">
				<label className="block">
					<span className="mb-2 block text-xs font-bold text-[#2b2b3e]">
						現在のパスワード
					</span>
					<input
						type="password"
						name="currentPassword"
						autoComplete="current-password"
						required
						className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
						placeholder="••••••••"
					/>
				</label>
				<label className="block">
					<span className="mb-2 block text-xs font-bold text-[#2b2b3e]">
						新しいパスワード
					</span>
					<input
						type="password"
						name="newPassword"
						autoComplete="new-password"
						required
						className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#ff4fa3] focus:shadow-[0_0_0_4px_rgba(255,79,163,0.12)]"
						placeholder="••••••••"
					/>
				</label>
				<label className="block">
					<span className="mb-2 block text-xs font-bold text-[#2b2b3e]">
						新しいパスワード（確認）
					</span>
					<input
						type="password"
						name="newPasswordConfirm"
						autoComplete="new-password"
						required
						className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#ff4fa3] focus:shadow-[0_0_0_4px_rgba(255,79,163,0.12)]"
						placeholder="••••••••"
					/>
				</label>
				<button
					type="submit"
					className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#2b2b3e]"
				>
					パスワードを更新
				</button>
			</form>
		</div>
	);
}
