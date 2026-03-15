"use client";

import { FamilyUserAddPanel } from "./baseInfoPanel/familyUserAddPanel";

type FamilyUserPanelProps = {
	isActive: boolean;
	index: number;
};

export function FamilyUserPanel({ isActive, index }: FamilyUserPanelProps) {
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
			<h2 className="mt-0 text-2xl font-semibold">家族ユーザー追加</h2>
			<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
				family owner のみ、新しい家族ユーザーを作成できます。
			</p>
			<FamilyUserAddPanel />
		</section>
	);
}
