import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { TicketIssueResponse } from "./types";

const ISSUE_REQUEST_TIMEOUT_MS = 45000;

export function useTicketIssue() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

	const clearMessages = () => {
		setSubmitError(null);
		setSubmitSuccess(null);
	};

	const submitTicketIssue = async (
		event: FormEvent<HTMLFormElement>,
	): Promise<boolean> => {
		event.preventDefault();
		const form = event.currentTarget;
		const formData = new FormData(form);

		clearMessages();
		setIsSubmitting(true);
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		try {
			const abortController = new AbortController();
			timeoutId = setTimeout(
				() => abortController.abort(),
				ISSUE_REQUEST_TIMEOUT_MS,
			);
			const response = await fetch("/api/tickets/issue", {
				method: "POST",
				body: formData,
				signal: abortController.signal,
			});
			const result = (await response.json()) as TicketIssueResponse;
			if (!response.ok || !result.ok) {
				setSubmitError(
					result.message ??
						"チケット発行に失敗しました。時間をおいて再試行してください。",
				);
				return false;
			}

			const successMessage = result.mosaicId
				? `チケットを発行しました。Mosaic ID: ${result.mosaicId}${result.transactionHash ? ` / Tx: ${result.transactionHash}` : ""}`
				: "チケットを発行しました。";
			setSubmitSuccess(successMessage);
			form.reset();
			router.refresh();
			return true;
		} catch (error) {
			const knownError = error as { name?: string } | null;
			if (knownError?.name === "AbortError") {
				setSubmitError("発行処理がタイムアウトしました。もう一度お試しください。");
			} else {
				setSubmitError("通信エラーが発生しました。接続状態を確認してください。");
			}
			return false;
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			setIsSubmitting(false);
		}
	};

	return {
		isSubmitting,
		submitError,
		submitSuccess,
		clearMessages,
		submitTicketIssue,
	};
}
