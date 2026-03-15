"use client";

type AgendaPanelProps = {
	isActive: boolean;
	index: number;
};

export function AgendaPanel({ isActive, index }: AgendaPanelProps) {
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
			<h2 className="mt-0 text-2xl font-semibold">議題</h2>
			<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
				このパネルはダミーです。将来的に会議で扱う議題一覧や提案機能を配置します。
			</p>

			<div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-[linear-gradient(180deg,#ffffff,#f6f7fb)] p-6">
				<p className="text-lg font-bold text-[#202033]">議題パネル準備中</p>
				<p className="mt-3 text-sm leading-6 text-[#4b4b65]">
					ここに会議で話し合うトピック、優先度、提案者、進行状況などを表示する想定です。
				</p>
			</div>
		</section>
	);
}
