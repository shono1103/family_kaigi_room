"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SymbolAccount = {
	address: string;
	publicKey: string;
	privateKey: string;
};

export function SymbolAccountReviewClient() {
	const router = useRouter();
	const [symbolAccount, setSymbolAccount] = useState<SymbolAccount | null>(null);

	useEffect(() => {
		const raw = sessionStorage.getItem("first_login_symbol_account");
		if (!raw) {
			router.replace("/");
			return;
		}

		try {
			setSymbolAccount(JSON.parse(raw) as SymbolAccount);
		} catch {
			sessionStorage.removeItem("first_login_symbol_account");
			router.replace("/");
		}
	}, [router]);

	if (!symbolAccount) {
		return null;
	}

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f4f5f8,#eceff4)] px-4 py-10 text-[#1e1e2a]">
			<div className="mx-auto max-w-[720px] rounded-[28px] bg-white/92 p-6 shadow-[0_18px_55px_rgba(20,15,45,0.18)] md:p-8">
				<div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
					初回設定完了
				</div>
				<h1 className="mt-4 text-2xl font-semibold">Symbol アカウント情報</h1>
				<p className="mt-2 text-sm text-[#4b4b65]">
					初回設定が完了し、10 Voice を送付しました。以下の情報を保管してください。
				</p>
				<div className="mt-6 space-y-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
					<div>
						<p className="text-xs font-bold text-[#4b4b65]">Address</p>
						<p className="mt-1 break-all font-mono text-sm text-[#202033]">
							{symbolAccount.address}
						</p>
					</div>
					<div>
						<p className="text-xs font-bold text-[#4b4b65]">Public Key</p>
						<p className="mt-1 break-all font-mono text-sm text-[#202033]">
							{symbolAccount.publicKey}
						</p>
					</div>
					<div>
						<p className="text-xs font-bold text-[#4b4b65]">Private Key</p>
						<p className="mt-1 break-all font-mono text-sm text-[#202033]">
							{symbolAccount.privateKey}
						</p>
					</div>
				</div>
				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={() => {
							sessionStorage.removeItem("first_login_symbol_account");
							router.push("/");
							router.refresh();
						}}
						className="rounded-xl bg-[#1e1e2a] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
					>
						ホームへ進む
					</button>
				</div>
			</div>
		</div>
	);
}
