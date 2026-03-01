"use client";

import { FormEvent, useState } from "react";

type OwnTicketPanelProps = {
	isActive: boolean;
	index: number;
};

type TicketIssueResponse = {
	ok: boolean;
	message?: string;
	mosaicId?: string;
	transactionHash?: string;
};

export function OwnTicketPanel({ isActive, index }: OwnTicketPanelProps) {
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

	const handleSubmitTicketIssue = async (
		event: FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();
		const form = event.currentTarget;
		const formData = new FormData(form);

		setSubmitError(null);
		setSubmitSuccess(null);
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/tickets/issue", {
				method: "POST",
				body: formData,
			});
			const result = (await response.json()) as TicketIssueResponse;
			if (!response.ok || !result.ok) {
				setSubmitError(
					result.message ??
						"チケット発行に失敗しました。時間をおいて再試行してください。",
				);
				return;
			}

			const successMessage = result.mosaicId
				? `チケットを発行しました。Mosaic ID: ${result.mosaicId}`
				: "チケットを発行しました。";
			setSubmitSuccess(successMessage);
			setIsIssueModalOpen(false);
			form.reset();
		} catch {
			setSubmitError("通信エラーが発生しました。接続状態を確認してください。");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section
			id={`panel-${index}`}
			role="tabpanel"
			aria-labelledby={`tab-${index}`}
			aria-hidden={!isActive}
			className={[
				"min-h-[60svh] origin-top transition duration-150 ease-out",
				isActive
					? "block translate-y-0 scale-100 opacity-100"
					: "hidden translate-y-2 scale-[0.98] opacity-0",
			].join(" ")}
		>
			<div className="flex items-start justify-between gap-3">
				<h2 className="mt-0 text-2xl font-semibold">保有チケット</h2>
				<button
					type="button"
					onClick={() => {
						setSubmitError(null);
						setSubmitSuccess(null);
						setIsIssueModalOpen(true);
					}}
					className="rounded-lg bg-[#1e1e2a] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
				>
					チケット発行
				</button>
			</div>
			<p className="mt-4 text-sm font-semibold text-[#4b4b65]">
				発行済みチケットのカード表示は次ステップで追加します。
			</p>
			{submitSuccess ? (
				<p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
					{submitSuccess}
				</p>
			) : null}
			{submitError ? (
				<p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
					{submitError}
				</p>
			) : null}

			{isIssueModalOpen ? (
				<div
					className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-8"
					role="dialog"
					aria-modal="true"
					aria-label="チケット発行"
				>
					<div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-[0_18px_55px_rgba(20,15,45,0.28)]">
						<div className="flex items-center justify-between gap-4">
							<h3 className="text-xl font-extrabold text-[#1e1e2a]">
								チケット発行
							</h3>
							<button
								type="button"
								onClick={() => setIsIssueModalOpen(false)}
								className="rounded-md border border-black/15 px-3 py-1 text-sm font-semibold text-[#2e2e44] transition hover:bg-black/5"
							>
								閉じる
							</button>
						</div>

						<form
							onSubmit={handleSubmitTicketIssue}
							className="mt-5 space-y-4"
						>
							<div>
								<label
									htmlFor="ticket-name"
									className="text-sm font-bold text-[#2f2f47]"
								>
									名称
								</label>
								<input
									id="ticket-name"
									name="name"
									required
									maxLength={100}
									className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
									placeholder="例: 2026春ライブ S席"
								/>
							</div>
							<div>
								<label
									htmlFor="ticket-detail"
									className="text-sm font-bold text-[#2f2f47]"
								>
									詳細
								</label>
								<textarea
									id="ticket-detail"
									name="detail"
									required
									maxLength={1200}
									rows={5}
									className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
									placeholder="公演日・会場・座席などを入力"
								/>
							</div>
							<div>
								<label
									htmlFor="ticket-thumbnail"
									className="text-sm font-bold text-[#2f2f47]"
								>
									サムネイル画像
								</label>
								<input
									id="ticket-thumbnail"
									type="file"
									name="thumbnailImage"
									required
									accept="image/*"
									className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#1e1e2a] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
								/>
								<p className="mt-1 text-xs font-medium text-[#5f5f77]">
									画像本体ではなく、画像情報（SHA-256など）をオンチェーンに保存します。
								</p>
							</div>
							<div>
								<label
									htmlFor="ticket-issuer-private-key"
									className="text-sm font-bold text-[#2f2f47]"
								>
									発行者秘密鍵
								</label>
								<input
									id="ticket-issuer-private-key"
									type="password"
									name="issuerPrivateKey"
									required
									minLength={64}
									maxLength={66}
									autoComplete="off"
									className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 font-mono text-sm tracking-[0.02em]"
									placeholder="64桁16進数（0x プレフィックス可）"
								/>
							</div>
							<label className="flex items-center gap-2 text-sm font-semibold text-[#2f2f47]">
								<input
									type="checkbox"
									name="isUsed"
									value="true"
									className="size-4 rounded border-black/20"
								/>
								使用済み？
							</label>

							<div className="flex justify-end gap-2 pt-2">
								<button
									type="button"
									onClick={() => setIsIssueModalOpen(false)}
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
									{isSubmitting ? "発行中..." : "発行する"}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</section>
	);
}
