import type { GetVoiceDetailsResult } from "@/lib/symbol/useCase/voice/read";

type FamilyVoicePanelProps = {
	isActive: boolean;
	index: number;
	familyName: string | null;
	familyVoice: GetVoiceDetailsResult;
};

function getStatusMessage(familyVoice: GetVoiceDetailsResult) {
	if (familyVoice.ok) {
		return null;
	}

	switch (familyVoice.status) {
		case "invalid_public_key":
			return "家族のSymbol公開鍵が未設定または不正です。設定を確認してください。";
		case "invalid_mosaic_id":
			return "familyVoice の Mosaic ID が不正です。";
		case "account_not_found":
			return "家族のSymbolアカウントが見つかりません。";
		case "invalid_voice_metadata":
			return "familyVoice のメタデータを読み取れませんでした。";
		case "node_unreachable":
			return "Symbolノードへ接続できませんでした。時間をおいて再試行してください。";
		default:
			return "familyVoice の読み取りに失敗しました。時間をおいて再試行してください。";
	}
}

export function FamilyVoicePanel({
	isActive,
	index,
	familyName,
	familyVoice,
}: FamilyVoicePanelProps) {
	const statusMessage = getStatusMessage(familyVoice);

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
			<h2 className="mt-0 text-2xl font-semibold">Voice</h2>
			{familyVoice.ok ? (
				<div className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
					<div className="rounded-xl border border-black/10 bg-white/70 p-3">
						<p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4b4b65]">
							Family Voice
						</p>
						<p className="mt-1 text-2xl font-extrabold text-[#202033]">
							{familyVoice.amountRaw}
						</p>
					</div>
					<div className="rounded-xl border border-black/10 bg-white/70 p-3">
						<p className="text-xs font-bold text-[#4b4b65]">
							{familyName ?? "家族"}のVoice
						</p>
						<p className="mt-1 text-lg font-bold text-[#202033]">
							{familyVoice.voiceMetadata.name}
						</p>
						<p className="mt-2 text-sm text-[#4b4b65]">
							{familyVoice.voiceMetadata.detail}
						</p>
					</div>
					<p className="text-xs font-semibold text-[#4b4b65]">
						Mosaic ID: {familyVoice.mosaicIdHex}
					</p>
				</div>
			) : (
				<div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
					<p className="text-sm font-semibold text-[#4b4b65]">
						{statusMessage}
					</p>
				</div>
			)}
		</section>
	);
}
