type UserPanelProps = {
	isActive: boolean;
	index: number;
};

export function UserPanel({ isActive, index }: UserPanelProps) {
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
			<h2 className="mt-0 text-2xl font-semibold">ユーザー</h2>
			<p className="mt-3">あ</p>
		</section>
	);
}
