import { redirect } from "next/navigation";
import { PasswordForm } from "./PasswordForm";
import { getCurrentAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const errorMessageMap: Record<string, string> = {
	invalid_request: "入力内容が不正です。",
	password_mismatch: "パスワード確認が一致しません。",
	setup_failed: "初回設定の完了に失敗しました。時間をおいて再試行してください。",
};

type PasswordPageProps = {
	searchParams?: Promise<{
		error?: string;
	}>;
};

export default async function FirstLoginPasswordPage({
	searchParams,
}: PasswordPageProps) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		redirect("/login");
	}

	const user = await prisma.user.findUnique({
		where: { id: auth.user.id },
		select: { isFirst: true },
	});

	if (!user?.isFirst) {
		redirect("/");
	}

	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const errorMessage = resolvedSearchParams?.error
		? (errorMessageMap[resolvedSearchParams.error] ??
			"不明なエラーが発生しました。もう一度お試しください。")
		: null;

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f4f5f8,#eceff4)] px-4 py-10 text-[#1e1e2a]">
			<div className="mx-auto max-w-[720px] rounded-[28px] bg-white/92 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.18)] md:p-8">
				<div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
					初回ログイン設定
				</div>
				<h1 className="mt-4 text-2xl font-semibold">パスワード再設定</h1>
				<p className="mt-2 text-sm text-[#4b4b65]">
					初回ログインのため、まず新しいパスワードを設定してください。
				</p>
				<PasswordForm initialErrorMessage={errorMessage} />
			</div>
		</div>
	);
}
