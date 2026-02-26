"use client";

import { useState } from "react";
import { BaseInfoPanelEdit } from "./edit";
import type { BaseInfoPanelMode, BaseUserInfo } from "./types";
import { BaseInfoPanelView } from "./view";

type BaseInfoPanelProps = {
	isActive: boolean;
	index: number;
	userEmail: string;
	userInfo: BaseUserInfo;
};

export function BaseInfoPanel({
	isActive,
	index,
	userEmail,
	userInfo,
}: BaseInfoPanelProps) {
	const [mode, setMode] = useState<BaseInfoPanelMode>("view");

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
					{mode === "edit" ? (
						<BaseInfoPanelEdit
							userInfo={userInfo}
							onCancel={() => setMode("view")}
						/>
					) : (
						<BaseInfoPanelView userInfo={userInfo} onEdit={() => setMode("edit")} />
					)}
				</div>
			</div>

		</section>
	);
}
