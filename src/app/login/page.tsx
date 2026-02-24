import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/lib/auth/session";
import { ensureInitialUserExists } from "@/lib/auth/bootstrap";

const errorMessageMap: Record<string, string> = {
	invalid_request: "メールアドレスとパスワードを入力してください。",
	invalid_credentials: "メールアドレスまたはパスワードが正しくありません。",
};

type LoginPageProps = {
	searchParams?: Promise<{
		error?: string;
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
	const errorMessage = errorCode ? errorMessageMap[errorCode] : null;

	return (
		<div className="min-h-screen bg-[radial-gradient(900px_600px_at_15%_15%,rgba(255,79,163,0.18),transparent_60%),radial-gradient(900px_600px_at_85%_25%,rgba(124,92,255,0.18),transparent_60%),linear-gradient(180deg,#fff4fb,#f2fbff)] bg-fixed bg-cover px-4 py-10 text-[#1e1e2a]">
			<div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-[520px] place-items-center">
				<section className="w-full rounded-[28px] bg-white/90 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.18)]">
					<div className="inline-flex items-center rounded-full border border-[rgba(255,79,163,0.15)] bg-white px-3 py-1 text-[12px] font-bold text-[#6b5b95]">
						Login
					</div>
					<h1 className="mt-4 text-2xl font-semibold">ログイン</h1>
					<p className="mt-2 text-sm text-[#4b4b65]">
						セッション管理機能を使うためにログインしてください。
					</p>

					<form action="/auth" method="post" className="mt-6 space-y-4">
						<label className="block">
							<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
								メールアドレス
							</span>
							<input
								type="email"
								name="email"
								autoComplete="email"
								required
								className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
								placeholder="user@example.com"
							/>
						</label>

						<label className="block">
							<span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
								パスワード
							</span>
							<input
								type="password"
								name="password"
								autoComplete="current-password"
								required
								className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#ff4fa3] focus:shadow-[0_0_0_4px_rgba(255,79,163,0.12)]"
								placeholder="••••••••"
							/>
						</label>

						{errorMessage ? (
							<p className="rounded-2xl border border-[#ff4fa3]/20 bg-[#fff1f8] px-4 py-3 text-sm text-[#9c2d6a]">
								{errorMessage}
							</p>
						) : null}

						<button
							type="submit"
							className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#ff4fa3] to-[#7c5cff] px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(124,92,255,0.28)] transition hover:-translate-y-0.5"
						>
							ログイン
						</button>
						<button
							type="submit"
							className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#ff4fa3] to-[#7c5cff] px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(124,92,255,0.28)] transition hover:-translate-y-0.5"
						>
							新規ユーザー作成
						</button>
					</form>
				</section>
			</div>
		</div>
	);
}
