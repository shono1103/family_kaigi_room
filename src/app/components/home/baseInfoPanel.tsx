type BaseInfoPanelProps = {
	isActive: boolean;
	index: number;
	userEmail: string;
	userInfo: {
		name: string;
		role: string;
		symbolPubKey: string | null;
	} | null;
	currentSessionId: string;
	sessions: BaseInfoSessionView[];
};

export type BaseInfoSessionView = {
	id: string;
	createdAtLabel: string;
	expiresAtLabel: string;
};

export function BaseInfoPanel({
	isActive,
	index,
	userEmail,
	userInfo,
	currentSessionId,
	sessions,
}: BaseInfoPanelProps) {
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
				<div className="mt-4 grid gap-3 sm:grid-cols-2">
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
				<form action="/user-info" method="post" className="mt-4 space-y-3">
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
				<div className="mt-4 flex flex-wrap gap-2">
					<form action="/auth/logout" method="post">
						<button
							type="submit"
							className="cursor-pointer rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#7c5cff] px-4 py-2 text-xs font-extrabold text-white"
						>
							この端末をログアウト
						</button>
					</form>
					<form action="/sessions/revoke-others" method="post">
						<button
							type="submit"
							className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#2b2b3e]"
						>
							他のセッションを失効
						</button>
					</form>
				</div>
			</div>

			<div className="mt-6">
				<div className="mb-3 flex items-center justify-between gap-3">
					<h3 className="text-lg font-semibold text-[#202033]">有効なセッション一覧</h3>
					<span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-[#4b4b65]">
						{sessions.length} 件
					</span>
				</div>

				<div className="space-y-3">
					{sessions.map((session) => {
						const isCurrent = session.id === currentSessionId;

						return (
							<div
								key={session.id}
								className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_24px_rgba(20,15,45,0.06)]"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-sm font-semibold text-[#202033]">
												{isCurrent ? "現在のセッション" : "別セッション"}
											</p>
											<span
												className={[
													"rounded-full px-2.5 py-1 text-[11px] font-extrabold",
													isCurrent
														? "bg-[#eef5ff] text-[#355ea8]"
														: "bg-black/5 text-[#4b4b65]",
												].join(" ")}
											>
												{isCurrent ? "Current" : "Active"}
											</span>
										</div>
										<p className="mt-2 text-xs text-[#4b4b65]">
											作成: {session.createdAtLabel}
										</p>
										<p className="mt-1 text-xs text-[#4b4b65]">
											期限: {session.expiresAtLabel}
										</p>
									</div>

									{isCurrent ? null : (
										<form action="/sessions/revoke" method="post">
											<input type="hidden" name="sessionId" value={session.id} />
											<button
												type="submit"
												className="cursor-pointer rounded-xl border border-[#ff4fa3]/20 bg-[#fff1f8] px-3 py-2 text-xs font-bold text-[#9c2d6a]"
											>
												失効
											</button>
										</form>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
