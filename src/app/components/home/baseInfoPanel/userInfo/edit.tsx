import type { userInfoForBaseInfo } from "./types";

type UserInfoEditProps = {
  userInfo: userInfoForBaseInfo;
  onCancel: () => void;
};

export function UserInfoEdit({ userInfo, onCancel }: UserInfoEditProps) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#4b4b65]">プロフィール編集</p>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#2b2b3e]"
        >
          表示に戻る
        </button>
      </div>

      <form action="/user-info" method="post" className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-bold text-[#2b2b3e]">名前</span>
            <input
              type="text"
              name="name"
              required
              defaultValue={userInfo?.name ?? ""}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
              placeholder="山田 太郎"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-bold text-[#2b2b3e]">
              Symbol Public Key（任意）
            </span>
            <input
              type="text"
              name="symbolPubKey"
              defaultValue={userInfo?.symbolPubKey ?? ""}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7c5cff] focus:shadow-[0_0_0_4px_rgba(124,92,255,0.12)]"
              placeholder="T... / N..."
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#2b2b3e]"
          >
            基本情報を保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-xl border border-black/10 bg-black/[0.03] px-4 py-2 text-xs font-bold text-[#4b4b65]"
          >
            キャンセル
          </button>
        </div>
      </form>
    </>
  );
}
