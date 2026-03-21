"use client";

import { useState } from "react";
import type { QuestIssueModalProps } from "./types";

export function QuestIssueModal({
	isOpen,
	onClose,
	onSubmit,
	isSubmitting,
	isFamilyOwner,
	targetUsers,
}: QuestIssueModalProps) {
	const [questType, setQuestType] = useState<"personalQuest" | "familyQuest">(
		"personalQuest",
	);

	if (!isOpen) {
		return null;
	}

	const isFamily = questType === "familyQuest";
	const voiceMin = isFamily ? 1 : 1;
	const voiceMax = isFamily ? 100 : 5;

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-8"
			role="dialog"
			aria-modal="true"
			aria-label="クエスト発行"
		>
			<div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-[0_18px_55px_rgba(20,15,45,0.28)]">
				<div className="flex items-center justify-between gap-4">
					<h3 className="text-xl font-extrabold text-[#1e1e2a]">クエスト作成</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-black/15 px-3 py-1 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
					>
						閉じる
					</button>
				</div>

				<form onSubmit={onSubmit} className="mt-5 space-y-4">
					{isFamilyOwner ? (
						<div>
							<label className="text-sm font-bold text-[#2f2f47]">
								クエスト種別
							</label>
							<div className="mt-1 flex gap-3">
								<label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm has-[:checked]:border-[#1e1e2a] has-[:checked]:bg-[#1e1e2a]/5">
									<input
										type="radio"
										name="questType"
										value="personalQuest"
										checked={questType === "personalQuest"}
										onChange={() => setQuestType("personalQuest")}
									/>
									<span className="font-semibold">パーソナル</span>
									<span className="text-xs text-[#6a6a84]">報酬 1〜5</span>
								</label>
								<label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm has-[:checked]:border-[#1e1e2a] has-[:checked]:bg-[#1e1e2a]/5">
									<input
										type="radio"
										name="questType"
										value="familyQuest"
										checked={questType === "familyQuest"}
										onChange={() => setQuestType("familyQuest")}
									/>
									<span className="font-semibold">ファミリー</span>
									<span className="text-xs text-[#6a6a84]">報酬 1〜100・全員対象</span>
								</label>
							</div>
						</div>
					) : (
						<input type="hidden" name="questType" value="personalQuest" />
					)}

					<div>
						<label htmlFor="quest-title" className="text-sm font-bold text-[#2f2f47]">
							タイトル
						</label>
						<input
							id="quest-title"
							name="title"
							required
							maxLength={100}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
							placeholder="例: お手伝いを30分やる"
						/>
					</div>

					<div>
						<label htmlFor="quest-detail" className="text-sm font-bold text-[#2f2f47]">
							詳細
						</label>
						<textarea
							id="quest-detail"
							name="detail"
							required
							maxLength={1200}
							rows={6}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
							placeholder="達成条件や補足を入力"
						/>
					</div>

					<div>
						<label htmlFor="quest-voice-reward" className="text-sm font-bold text-[#2f2f47]">
							報酬 Voice
							<span className="ml-1 text-xs font-normal text-[#6a6a84]">
								({voiceMin}〜{voiceMax})
							</span>
						</label>
						<input
							id="quest-voice-reward"
							name="voiceReward"
							type="number"
							required
							min={voiceMin}
							max={voiceMax}
							defaultValue={voiceMin}
							className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
						/>
					</div>

					{!isFamily ? (
						<>
							<div>
								<label
									htmlFor="quest-target-user"
									className="text-sm font-bold text-[#2f2f47]"
								>
									対象ユーザー
								</label>
								<select
									id="quest-target-user"
									name="targetUserId"
									required
									defaultValue=""
									className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
								>
									<option value="" disabled>
										対象ユーザーを選択
									</option>
									{targetUsers.map((user) => (
										<option key={user.id} value={user.id}>
											{user.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label
									htmlFor="quest-issuer-private-key"
									className="text-sm font-bold text-[#2f2f47]"
								>
									あなたのSymbol秘密鍵
									<span className="ml-1 text-xs font-normal text-[#6a6a84]">
										(報酬エスクロー送金に使用・保存されません)
									</span>
								</label>
								<input
									id="quest-issuer-private-key"
									name="issuerPrivateKey"
									type="password"
									required
									autoComplete="off"
									className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 font-mono text-sm"
									placeholder="64文字の16進数"
								/>
							</div>
						</>
					) : (
						<p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
							ファミリークエストは家族全員を対象に一人ずつ発行されます。
						</p>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
							disabled={isSubmitting}
						>
							キャンセル
						</button>
						<button
							type="submit"
							className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={isSubmitting}
						>
							{isSubmitting ? "作成中..." : "作成する"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
