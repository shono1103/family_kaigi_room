import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/lib/auth/session";
import { AuthCard } from "@/app/components/auth/authCard";
import type { AuthMode } from "@/app/components/auth/authTypes";

const errorMessageMap: Record<string, string> = {
	invalid_request: "メールアドレスとパスワードを入力してください。",
	invalid_credentials: "メールアドレスまたはパスワードが正しくありません。",
	signup_invalid_request:
		"家族名・メールアドレス・パスワード・Symbol秘密鍵を入力してください。",
	signup_password_mismatch: "パスワード確認が一致しません。",
	signup_email_taken: "このメールアドレスは既に使用されています。",
	signup_symbol_pub_key_taken:
		"このSymbol公開鍵は既に使用されています。別の秘密鍵を入力してください。",
	signup_symbol_priv_key_taken:
		"このSymbol秘密鍵は既に使用されています。別の秘密鍵を入力してください。",
	signup_currency_mosaic_taken:
		"家族通貨の識別子が重複しました。もう一度お試しください。",
	signup_unique_conflict:
		"一意制約に抵触しました。入力内容を見直して再試行してください。",
	signup_symbol_invalid:
		"入力されたSymbol秘密鍵が不正です。内容を確認してください。",
	signup_symbol_funding_failed:
		"家族用Symbolアカウントへの初期送金に失敗しました。時間を置いて再試行してください。",
	signup_symbol_issue_failed:
		"家族通貨の発行に失敗しました。時間を置いて再試行してください。",
	signup_session_failed:
		"家族会議室は作成されましたが、ログインセッションの作成に失敗しました。再度ログインしてください。",
	signup_failed:
		"家族会議室の作成に失敗しました。時間を置いて再試行してください。",
};

type LoginPageProps = {
	searchParams?: Promise<{
		error?: string;
		mode?: string;
	}>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
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
