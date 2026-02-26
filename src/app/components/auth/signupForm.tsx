import { AuthErrorMessage } from "./authErrorMessage";

type SignupFormProps = {
  errorMessage: string | null;
};

export function SignupForm({ errorMessage }: SignupFormProps) {
  return (
    <form action="/auth/register" method="post" className="mt-6 space-y-4">
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
          autoComplete="new-password"
          required
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#ff4fa3] focus:shadow-[0_0_0_4px_rgba(255,79,163,0.12)]"
          placeholder="••••••••"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-[#2b2b3e]">
          パスワード（確認）
        </span>
        <input
          type="password"
          name="passwordConfirm"
          autoComplete="new-password"
          required
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#ff4fa3] focus:shadow-[0_0_0_4px_rgba(255,79,163,0.12)]"
          placeholder="••••••••"
        />
      </label>

      <AuthErrorMessage message={errorMessage} />

      <button
        type="submit"
        className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#ff4fa3] to-[#7c5cff] px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(124,92,255,0.28)] transition hover:-translate-y-0.5"
      >
        新規ユーザー作成
      </button>
    </form>
  );
}
