export type SymbolTransactionStatus = {
	group?: string;
	code?: string;
	[key: string]: unknown;
};

export type PollTransactionStateResult =
	| { state: 'confirmed' }
	| { state: 'failed'; status: SymbolTransactionStatus }
	| { state: 'timeout'; status?: SymbolTransactionStatus };

export const pollTransactionState = async (
	nodeUrl: string,
	hash: string,
	timeoutMs = 120000,
	intervalMs = 3000
): Promise<PollTransactionStateResult> => {
	const startedAt = Date.now();
	let lastStatus: SymbolTransactionStatus | undefined;

	while (Date.now() - startedAt < timeoutMs) {
		const confirmedRes = await fetch(`${nodeUrl}/transactions/confirmed/${hash}`);
		if (confirmedRes.ok)
			return { state: 'confirmed' };

		const statusRes = await fetch(`${nodeUrl}/transactionStatus/${hash}`);
		if (statusRes.ok) {
			const status = (await statusRes.json()) as SymbolTransactionStatus;
			lastStatus = status;
			if ('failed' === status.group || ('string' === typeof status.code && status.code.startsWith('Failure_')))
				return { state: 'failed', status };
		}

		await new Promise(resolve => setTimeout(resolve, intervalMs));
	}

	return { state: 'timeout', status: lastStatus };
};
