import type { UserViewProps } from "./types";

export function UserView({ userEmail, onEdit }: UserViewProps) {
	return (
		<>
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm text-[#4b4b65]">ログイン中ユーザー</p>
				<button
					type="button"
					onClick={onEdit}
					className="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#2b2b3e]"
				>
					編集
				</button>
			</div>
			<p className="mt-1 break-all text-base font-semibold text-[#202033]">
				{userEmail}
			</p>
		</>
	);
}
