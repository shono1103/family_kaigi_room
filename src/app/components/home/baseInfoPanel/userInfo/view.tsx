type UserInfoViewProps = {
	userInfo: {
		name: string;
		symbolPubKey: string | null;
	} | null;
	onEdit: () => void;
};

export function UserInfoView({ userInfo, onEdit }: UserInfoViewProps) {
	return (
		<>
			<div className="mb-3 flex items-center justify-between gap-2">
				<p className="text-xs font-bold text-[#4b4b65]">プロフィール</p>
				<button
					type="button"
					onClick={onEdit}
					className="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#2b2b3e]"
				>
					編集
				</button>
			</div>

			<div className="grid gap-3">
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
						Symbol Public Key
					</p>
					<p className="mt-1 break-all text-sm font-semibold text-[#202033]">
						{userInfo?.symbolPubKey ?? "未設定"}
					</p>
				</div>
			</div>
		</>
	);
}
