"use client";

import { useState } from "react";

type BaseInfoPanelProps = {
	isActive: boolean;
	index: number;
	userEmail: string;
	userInfo: {
		name: string;
		role: string;
		symbolPubKey: string | null;
	} | null;
};

export function BaseInfoPanel({
	isActive,
	index,
	userEmail,
	userInfo,
}: BaseInfoPanelProps) {
	const [isEditing, setIsEditing] = useState(false);

	return (
		<section
			id={`panel-${index}`}
			role="tabpanel"
			aria-labelledby={`tab-${index}`}
			aria-hidden={!isActive}
			className={[
				"min-h-[60svh] origin-top transition duration-150 ease-out",
				isActive
					? "block translate-y-0 scale-100 opacity-100"
					: "hidden translate-y-2 scale-[0.98] opacity-0",
			].join(" ")}
		>
			<h2 className="mt-0 text-2xl font-semibold">基本情報</h2>
			<div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
				<p className="text-sm text-[#4b4b65]">ログイン中ユーザー</p>
				<p className="mt-1 break-all text-base font-semibold text-[#202033]">
					{userEmail}
				</p>
				<div className="mt-4 rounded-xl border border-black/10 bg-white/50 p-3">
					<div className="mb-3 flex items-center justify-between gap-2">
						<p className="text-xs font-bold text-[#4b4b65]">プロフィール</p>
						<button
							type="button"
							onClick={() => setIsEditing((prev) => !prev)}
							className="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#2b2b3e]"
						>
							{isEditing ? "表示に戻る" : "編集"}
						</button>
					</div>

					{isEditing ? (
						<form action="/user-info" method="post" className="space-y-3">
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
									<input
										type="text"
										name="symbolPubKey"
										defaultValue={userInfo?.symbolPubKey ?? ""}
										className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
										placeholder="T... / N..."
									/>
								</label>
							</div>
							<button
								type="submit"
								className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#2b2b3e]"
							>
								基本情報を保存
							</button>
						</form>
					) : (
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-black/10 bg-white/70 p-3">
								<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4b4b65]">
									Name
								</p>
								<p className="mt-1 text-sm font-semibold text-[#202033]">
									{userInfo?.name ?? "未設定"}
								</p>
							</div>
							<div className="rounded-xl border border-black/10 bg-white/70 p-3">
								<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4b4b65]">
									Role
								</p>
								<p className="mt-1 text-sm font-semibold text-[#202033]">
									{userInfo?.role ?? "未設定"}
								</p>
							</div>
							<div className="rounded-xl border border-black/10 bg-white/70 p-3 sm:col-span-2">
								<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4b4b65]">
									Symbol Public Key
								</p>
								<p className="mt-1 break-all text-sm font-semibold text-[#202033]">
									{userInfo?.symbolPubKey ?? "未設定"}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

		</section>
	);
}
