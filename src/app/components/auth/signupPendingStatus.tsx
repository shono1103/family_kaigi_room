"use client";

export function SignupPendingStatus() {
	return (
		<div className="mt-6 rounded-[24px] border border-black/10 bg-[linear-gradient(135deg,#fff7ed,#fff)] p-6 shadow-[0_18px_40px_rgba(20,15,45,0.08)]">
			<div className="flex items-center gap-3">
				<div className="h-3 w-3 animate-pulse rounded-full bg-[#ff8b3d]" />
				<p className="text-sm font-extrabold text-[#202033]">
					家族会議室を作成しています
				</p>
			</div>
			<p className="mt-3 text-sm leading-6 text-[#4b4b65]">
				family作成、初期ユーザー登録、家族通貨発行を順番に処理しています。
				そのままお待ちください。
			</p>
		</div>
	);
}
