import type { AuthMode } from "./authTypes";

type AuthModeSwitchProps = {
	mode: AuthMode;
};

export function AuthModeSwitch({ mode }: AuthModeSwitchProps) {
	return (
		<form action="/login" method="get" className="mt-3">
			{mode === "signup" ? null : (
				<input type="hidden" name="mode" value="signup" />
			)}
			<button
				type="submit"
				className="w-full cursor-pointer rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#2b2b3e] transition hover:-translate-y-0.5"
			>
				{mode === "signup" ? "ログイン画面に戻る" : "新規家族会議室作成"}
			</button>
		</form>
	);
}
