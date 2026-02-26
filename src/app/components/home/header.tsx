"use client";

type HeaderTab = {
	label: string;
};

type HeaderProps = {
	tabs: readonly HeaderTab[];
	activeIndex: number;
	onTabClick: (index: number) => void;
};

export function Header({ tabs, activeIndex, onTabClick }: HeaderProps) {
	return (
		<header className="rounded-[28px] bg-white/90 p-[22px] shadow-[0_18px_55px_rgba(20,15,45,0.18)]">
			<div className="mb-4 flex items-center gap-[14px]">
				<div className="grid h-[46px] w-[46px] rotate-[-6deg] place-items-center rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#7c5cff] text-lg font-black text-white">
					★
				</div>
				<div>
					<h1 className="text-[18px] font-semibold">Pop Switch Header</h1>
					<p className="mt-1.5 text-[13px] text-[#4b4b65]">
						タブでポップに画面切替
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<nav className="flex flex-wrap gap-2.5" role="tablist" aria-label="画面切替">
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
									"cursor-pointer rounded-[18px] px-4 py-2.5 text-[13px] font-extrabold transition duration-150 ease-in-out hover:-translate-y-0.5",
									isActive
										? "border-2 border-[rgba(255,79,163,0.25)] bg-white text-black shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
										: "border-2 border-transparent bg-black/5 text-black/65",
								].join(" ")}
							>
								{tab.label}
							</button>
						);
					})}
				</nav>
				<form action="/auth/logout" method="post">
					<button
						type="submit"
						className="cursor-pointer rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#7c5cff] px-4 py-2 text-xs font-extrabold text-white"
					>
						ログアウト
					</button>
				</form>
			</div>
		</header>
	);
}
