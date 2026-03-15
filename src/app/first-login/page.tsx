import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createSymbolAccount } from "@/lib/symbol/useCase/account/create";

const errorMessageMap: Record<string, string> = {
	invalid_request: "入力内容が不正です。",
	password_mismatch: "パスワード確認が一致しません。",
	private_key_not_saved: "秘密鍵を保存したことを確認してください。",
	invalid_symbol_public_key: "生成した Symbol 公開鍵が不正です。",
	setup_failed: "初回設定の完了に失敗しました。時間をおいて再試行してください。",
};

type FirstLoginPageProps = {
	searchParams?: Promise<{
		error?: string;
	}>;
};

export default async function FirstLoginPage({
	searchParams,
}: FirstLoginPageProps) {
	const auth = await getCurrentAuth({ mutateCookie: true });
	if (!auth) {
		redirect("/login");
	}

	const user = await prisma.user.findUnique({
		where: { id: auth.user.id },
		select: { isFirst: true, email: true },
	});

	if (!user?.isFirst) {
		redirect("/");
	}

	const userInfo = await prisma.userInfo.findUnique({
		where: { userId: auth.user.id },
		select: { name: true },
	});

	const symbolAccount = createSymbolAccount();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const errorMessage = resolvedSearchParams?.error
		? (errorMessageMap[resolvedSearchParams.error] ??
			"不明なエラーが発生しました。もう一度お試しください。")
		: null;
	const defaultName =
		userInfo?.name?.trim() ||
		user.email.split("@")[0]?.trim() ||
		auth.user.email.split("@")[0]?.trim() ||
		"";

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f4f5f8,#eceff4)] px-4 py-10 text-[#1e1e2a]">
			<div className="mx-auto max-w-[720px] rounded-[28px] bg-white/92 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.18)] md:p-8">
				<div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
					初回ログイン設定
				</div>
				<h1 className="mt-4 text-2xl font-semibold">
					パスワード再設定と Symbol アカウント作成
				</h1>
				<p className="mt-2 text-sm text-[#4b4b65]">
					初回ログインのため、パスワードを再設定し、Symbol アカウントの秘密鍵を必ず保存してください。
				</p>

				{errorMessage ? (
					<p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
						{errorMessage}
					</p>
				) : null}

				<form action="/api/auth/first-login" method="post" className="mt-6 space-y-5">
					<input type="hidden" name="symbolPubKey" value={symbolAccount.publicKey} />

					<label className="block">
						<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
							表示名
						</span>
						<input
							type="text"
							name="name"
							required
							defaultValue={defaultName}
							className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition"
							placeholder="表示名を入力"
						/>
					</label>

					<div className="grid gap-4 md:grid-cols-2">
						<label className="block">
							<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
								新しいパスワード
							</span>
							<input
								type="password"
								name="newPassword"
								autoComplete="new-password"
								required
								className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition"
								placeholder="新しいパスワード"
							/>
						</label>
						<label className="block">
							<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
								新しいパスワード（確認）
							</span>
							<input
								type="password"
								name="newPasswordConfirm"
								autoComplete="new-password"
								required
								className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition"
								placeholder="確認用パスワード"
							/>
						</label>
					</div>

					<div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
						<p className="text-sm font-bold text-amber-800">Symbol 秘密鍵</p>
						<p className="mt-2 text-xs font-semibold text-amber-700">
							この秘密鍵は再表示しません。必ず安全な場所に保存してください。
						</p>
						<textarea
							readOnly
							value={symbolAccount.privateKey}
							className="mt-3 min-h-24 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-[#2b2b3e]"
						/>
						<p className="mt-3 text-xs font-semibold text-[#4b4b65]">
							Symbol Public Key: {symbolAccount.publicKey}
						</p>
						<p className="mt-2 text-xs font-semibold text-[#4b4b65]">
							Symbol Address: {symbolAccount.address}
						</p>
						<label className="mt-4 flex items-start gap-2 text-sm font-semibold text-[#2b2b3e]">
							<input
								type="checkbox"
								name="privateKeySaved"
								value="true"
								required
								className="mt-0.5 size-4 rounded border-black/20"
							/>
							<span>秘密鍵を保存したので、次へ進みます。</span>
						</label>
					</div>

					<button
						type="submit"
						className="rounded-xl bg-[#1e1e2a] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
					>
						初回設定を完了する
					</button>
				</form>
			</div>
		</div>
	);
}
