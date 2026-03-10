"use client";

type SidebarTab = {
	label: string;
};

type SidebarProps = {
	tabs: readonly SidebarTab[];
	activeIndex: number;
	onTabClick: (index: number) => void;
};

export function Sidebar({ tabs, activeIndex, onTabClick }: SidebarProps) {
	return (
		<aside className="flex min-h-0 flex-col rounded-[32px] border border-black/10 bg-white/88 p-5 shadow-[0_20px_60px_rgba(20,15,45,0.12)] backdrop-blur lg:h-full">
			<div className="mb-6">
				<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#4b4b65]">
					Navigation
				</p>
			</div>

			<div className="flex min-h-0 flex-1 flex-col gap-6">
				<nav
					className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
					role="tablist"
					aria-label="画面切替"
				>
					{tabs.map((tab, index) => {
						const isActive = activeIndex === index;

						return (
							<button
								key={tab.label}
								type="button"
								role="tab"
								aria-selected={isActive}
								aria-controls={`panel-${index}`}
								id={`tab-${index}`}
								onClick={() => onTabClick(index)}
								className={[
									"flex w-full cursor-pointer items-center justify-between rounded-[18px] px-4 py-3 text-left text-[14px] font-bold transition duration-150 ease-in-out hover:bg-black/[0.04]",
									isActive
										? "border border-[#d8d4ff] bg-[linear-gradient(135deg,rgba(124,92,255,0.14),rgba(255,79,163,0.1))] text-[#1e1e2a] shadow-[0_12px_24px_rgba(124,92,255,0.12)]"
										: "border border-transparent bg-transparent text-black/65",
								].join(" ")}
							>
								<span>{tab.label}</span>
								<span
									aria-hidden="true"
									className={[
										"text-xs transition",
										isActive ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-40",
									].join(" ")}
								>
									→
								</span>
							</button>
						);
					})}
				</nav>

				<form action="/api/auth/logout" method="post" className="mt-auto pt-2">
					<button
						type="submit"
						className="w-full cursor-pointer rounded-2xl bg-[#1e1e2a] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
					>
						ログアウト
					</button>
				</form>
			</div>
		</aside>
	);
}
