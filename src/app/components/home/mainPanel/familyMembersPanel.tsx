"use client";

type FamilyMembersPanelProps = {
	isActive: boolean;
	index: number;
	members: Array<{
		id: string;
		name: string;
		email: string;
		familyRole: string | null;
		isFamilyOwner: boolean;
		isFirst: boolean;
		isCurrentUser: boolean;
	}>;
};

export function FamilyMembersPanel({
	isActive,
	index,
	members,
}: FamilyMembersPanelProps) {
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
			<h2 className="mt-0 text-2xl font-semibold">会議室メンバー</h2>
			<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
				同じ会議室に所属しているメンバーの一覧です。
			</p>

			<div className="mt-6 grid gap-4">
				{members.map((member) => (
					<div
						key={member.id}
						className="rounded-2xl border border-black/10 bg-black/[0.03] p-4"
					>
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className="text-base font-semibold text-[#202033]">
									{member.name}
								</p>
								<p className="mt-1 text-sm text-[#4b4b65]">{member.email}</p>
							</div>
							<div className="flex flex-wrap gap-2">
								{member.isCurrentUser ? (
									<span className="rounded-full bg-[#1e1e2a] px-3 py-1 text-xs font-bold text-white">
										あなた
									</span>
								) : null}
								{member.isFamilyOwner ? (
									<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
										owner
									</span>
								) : null}
								{member.isFirst ? (
									<span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
										初回設定待ち
									</span>
								) : null}
							</div>
						</div>
						<div className="mt-3 text-xs font-semibold text-[#4b4b65]">
							Family Role: {member.familyRole ?? "未設定"}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
