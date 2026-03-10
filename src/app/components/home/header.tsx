"use client";

type HeaderProps = {
	userEmail: string;
	userName?: string | null;
};

function getAccountLabel(userName: string | null | undefined, userEmail: string) {
	const source = (userName?.trim() || userEmail.split("@")[0] || "?").trim();
	return source.slice(0, 2).toUpperCase();
}

export function Header({ userEmail, userName }: HeaderProps) {
	const accountLabel = getAccountLabel(userName, userEmail);

	return (
		<header className="rounded-[28px] border border-black/10 bg-white/92 px-5 py-4 shadow-[0_18px_55px_rgba(20,15,45,0.08)] backdrop-blur md:px-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-4">
					<div>
						<h1 className="mt-1 text-[20px] font-semibold">
							家族会議室
						</h1>
					</div>
				</div>
				<div className="flex items-center justify-end gap-3">
					<div className="text-right">
						<p className="text-sm font-semibold text-[#1e1e2a]">
							{userName?.trim() || "アカウント"}
						</p>
						<p className="text-xs text-[#4b4b65]">{userEmail}</p>
					</div>
					<div className="grid h-11 w-11 place-items-center rounded-2xl border border-black/10 bg-[linear-gradient(135deg,#1e1e2a,#50506d)] text-sm font-bold text-white">
						{accountLabel}
					</div>
				</div>
			</div>
		</header>
	);
}
