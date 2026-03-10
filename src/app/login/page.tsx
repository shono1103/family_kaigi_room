import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/lib/auth/session";
import { ensureInitialUserExists } from "@/lib/auth/bootstrap";
import { AuthCard } from "@/app/components/auth/authCard";
import type { AuthMode } from "@/app/components/auth/authTypes";

const errorMessageMap: Record<string, string> = {
	invalid_request: "メールアドレスとパスワードを入力してください。",
	invalid_credentials: "メールアドレスまたはパスワードが正しくありません。",
	signup_invalid_request: "メールアドレス・パスワードを入力してください。",
	signup_password_mismatch: "パスワード確認が一致しません。",
	signup_email_taken: "このメールアドレスは既に使用されています。",
};

type LoginPageProps = {
	searchParams?: Promise<{
		error?: string;
		mode?: string;
	}>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
	await ensureInitialUserExists();

	const auth = await getCurrentAuth();
	if (auth) {
		redirect("/");
	}

	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const errorCode = resolvedSearchParams?.error;
	const mode: AuthMode =
		resolvedSearchParams?.mode === "signup" ? "signup" : "login";
	const errorMessage = errorCode
		? (errorMessageMap[errorCode] ??
			"不明なエラーが発生しました。お手数ですが、もう一度お試しください。")
		: null;

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f4f5f8,#eceff4)] bg-fixed bg-cover px-4 py-10 text-[#1e1e2a]">
			<div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-[520px] place-items-center">
				<AuthCard mode={mode} errorMessage={errorMessage} />
			</div>
		</div>
	);
}
