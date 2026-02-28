"use client";

import { useState } from "react";
import { UserInfoEdit } from "./userInfo/edit";
import { UserEdit } from "./user/edit";
import { UserView } from "./user/view";
import { UserInfoView } from "./userInfo/view";

type UserInfoPanelMode = "view" | "userEdit" | "profileEdit";

type BaseInfoPanelProps = {
	isActive: boolean;
	index: number;
	userEmail: string;
	userInfo: {
		name: string;
		symbolPubKey: string | null;
	} | null;
};

export function BaseInfoPanel({
	isActive,
	index,
	userEmail,
	userInfo,
}: BaseInfoPanelProps) {
	const [mode, setMode] = useState<UserInfoPanelMode>("view");
	const isUserEditing = mode === "userEdit";
	const isProfileEditing = mode === "profileEdit";

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
				<div className="rounded-xl border border-black/10 bg-white/50 p-3">
					{isUserEditing ? (
						<UserEdit
							userEmail={userEmail}
							onCancel={() => setMode("view")}
						/>
					) : (
						<UserView
							userEmail={userEmail}
							onEdit={() => setMode("userEdit")}
						/>
					)}
				</div>
				<div className="mt-4 rounded-xl border border-black/10 bg-white/50 p-3">
					{isProfileEditing ? (
						<UserInfoEdit
							userInfo={userInfo}
							onCancel={() => setMode("view")}
						/>
					) : (
						<UserInfoView
							userInfo={userInfo}
							onEdit={() => setMode("profileEdit")}
						/>
					)}
				</div>
			</div>
		</section>
	);
}
