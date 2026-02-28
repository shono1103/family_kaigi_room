import { AuthModeSwitch } from "./authModeSwitch";
import { LoginForm } from "./loginForm";
import { SignupForm } from "./signupForm";
import type { AuthMode } from "./authTypes";

type AuthCardProps = {
	mode: AuthMode;
	errorMessage: string | null;
};

export function AuthCard({ mode, errorMessage }: AuthCardProps) {
	return (
		<section className="w-full rounded-[28px] bg-white/90 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.18)]">
			<div className="inline-flex items-center rounded-full border border-[rgba(255,79,163,0.15)] bg-white px-3 py-1 text-[12px] font-bold text-[#6b5b95]">
				{mode === "signup" ? "Sign Up" : "Login"}
			</div>
			<h1 className="mt-4 text-2xl font-semibold">
				{mode === "signup" ? "新規ユーザー作成" : "ログイン"}
			</h1>
			<p className="mt-2 text-sm text-[#4b4b65]">
				{mode === "signup"
					? "新しいユーザーを作成して、そのままログインします。"
					: "セッション管理機能を使うためにログインしてください。"}
			</p>

			{mode === "signup" ? (
				<SignupForm errorMessage={errorMessage} />
			) : (
				<LoginForm errorMessage={errorMessage} />
			)}

			<AuthModeSwitch mode={mode} />
		</section>
	);
}
