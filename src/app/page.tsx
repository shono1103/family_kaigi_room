"use client";

import { useState } from "react";

const tabs = [
	{ label: "保有チケット", title: "保有チケット", content: "あ" },
	{ label: "ユーザー", title: "ユーザー", content: "あ" },
] as const;

export default function Home() {
	const [activeIndex, setActiveIndex] = useState(0);

	return (
		<div className="min-h-screen bg-[radial-gradient(900px_600px_at_15%_15%,rgba(255,79,163,0.18),transparent_60%),radial-gradient(900px_600px_at_85%_25%,rgba(124,92,255,0.18),transparent_60%),linear-gradient(180deg,#fff4fb,#f2fbff)] bg-fixed bg-cover text-[#1e1e2a]">
			<div className="mx-auto my-10 max-w-[900px] px-4 pb-20">
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
									onClick={() => setActiveIndex(index)}
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
				</header>

				<main className="mt-6 rounded-[28px] bg-white/90 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.18)]">
					{tabs.map((tab, index) => {
						const isActive = activeIndex === index;

						return (
							<section
								key={tab.title}
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
								<h2 className="mt-0 text-2xl font-semibold">{tab.title}</h2>
								<p className="mt-3">{tab.content}</p>
							</section>
						);
					})}
				</main>
			</div>
		</div>
	);
}
