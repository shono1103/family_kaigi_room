import { generateMosaicId, metadataUpdateValue, models, SymbolAccount, SymbolFacade } from 'symbol-sdk/symbol'

export type MosaicFlagOptions = {
	mutable: boolean,
	restrictable: boolean,
	revokable: boolean
}

export type CreateMosaicDefinitionTransactionParams = {
	duration: bigint;      // descriptorで最終的にBlockDurationへ変換される値
	nonce: number;         // MosaicNonceの元値
	flags: number;         // MosaicFlagsのbit値
	divisibility: number;  // 0..6想定
};

export type CreateMosaicDefinitionTransactionResult = {
	embeddedMosaicDefinition: models.EmbeddedTransaction;
	mosaicId: bigint;
};

export type CreateMosaicMetadataTransactionParams = Readonly<{
	mosaicId: bigint;
	scopedMetadataKey: bigint;
	metadataValue: string;
}>;

export type CreateMosaicSupplyIncreaseTransactionParams = Readonly<{
	mosaicId: bigint;
	delta: bigint;
}>;

export type CreateMosaicSupplyDecreaseTransactionParams = Readonly<{
	mosaicId: bigint;
	delta: bigint;
}>;

export type CreateAggregateTransactionParams = Readonly<{
	aggregateType: string;
	deadlineHours: number;
	embeddedTransactions: models.EmbeddedTransaction[];
	feeMultiplier: number;
}>;

export const toHexMosaicId = (mosaicId: bigint): string =>
	`0x${mosaicId.toString(16).toUpperCase().padStart(16, '0')}`;

export const toHexMetadataKey = (metadataKey: bigint): string =>
	`0x${metadataKey.toString(16).toUpperCase().padStart(16, '0')}`;

/**
 *
 * @param mosaicFlagOptions
 * フラグの具体的な値
 * @returns
 */
export const buildMosaicFlags = (mosaicFlagOptions: MosaicFlagOptions) => {
	let flags = models.MosaicFlags.TRANSFERABLE.value;
	if (mosaicFlagOptions.mutable)
		flags |= models.MosaicFlags.SUPPLY_MUTABLE.value;
	if (mosaicFlagOptions.restrictable)
		flags |= models.MosaicFlags.RESTRICTABLE.value;
	if (mosaicFlagOptions.revokable)
		flags |= models.MosaicFlags.REVOKABLE.value;
	return flags
}

/**
 * モザイク定義の埋め込みトランザクションを作成します。
 * 作成後に計算された mosaicId も返します。
 */
export const createMosaicDefinitionTransaction = (
	facade: SymbolFacade,
	account: SymbolAccount,
	params: CreateMosaicDefinitionTransactionParams,
): CreateMosaicDefinitionTransactionResult => {
	const embeddedMosaicDefinition = facade.transactionFactory.createEmbedded({
		type: 'mosaic_definition_transaction_v1',
		signerPublicKey: account.publicKey,
		id: 0n,
		duration: params.duration,
		nonce: params.nonce,
		flags: new models.MosaicFlags(params.flags),
		divisibility: params.divisibility
	});

	return {
		embeddedMosaicDefinition,
		mosaicId: generateMosaicId(account.address, params.nonce)
	};
};

/**
 * 指定したモザイクにメタデータを付与する埋め込みトランザクションを作成します。
 * 新規付与を前提に oldValue は undefined として差分を計算します。
 */
export const createMosaicMetadataTransaction = (
	facade: SymbolFacade,
	account: SymbolAccount,
	params: CreateMosaicMetadataTransactionParams
) => {
	const metadataValueBytes = new TextEncoder().encode(params.metadataValue);
	const metadataValueDiff = metadataUpdateValue(undefined, metadataValueBytes);
	const valueSizeDelta = metadataValueBytes.length;

	return facade.transactionFactory.createEmbedded({
		type: 'mosaic_metadata_transaction_v1',
		signerPublicKey: account.publicKey,
		targetAddress: account.address,
		scopedMetadataKey: params.scopedMetadataKey,
		targetMosaicId: new models.UnresolvedMosaicId(params.mosaicId),
		valueSizeDelta,
		value: metadataValueDiff
	});
};

/**
 * モザイク供給量を増加させる埋め込みトランザクションを作成します。
 */
export const createMosaicSupplyIncreaseTransaction = (
	facade: SymbolFacade,
	account: SymbolAccount,
	params: CreateMosaicSupplyIncreaseTransactionParams
) => facade.transactionFactory.createEmbedded({
	type: 'mosaic_supply_change_transaction_v1',
	signerPublicKey: account.publicKey,
	mosaicId: params.mosaicId,
	delta: params.delta,
	action: models.MosaicSupplyChangeAction.INCREASE
});

/**
 * モザイク供給量を減少させる埋め込みトランザクションを作成します。
 */
export const createMosaicSupplyDecreaseTransaction = (
	facade: SymbolFacade,
	account: SymbolAccount,
	params: CreateMosaicSupplyDecreaseTransactionParams
) => facade.transactionFactory.createEmbedded({
	type: 'mosaic_supply_change_transaction_v1',
	signerPublicKey: account.publicKey,
	mosaicId: params.mosaicId,
	delta: params.delta,
	action: models.MosaicSupplyChangeAction.DECREASE
});

/**
 * 複数の埋め込みトランザクションをまとめたアグリゲートトランザクションを作成します。
 * embedded transactions hash を計算し、サイズに応じた手数料を設定します。
 */
export const createAggregateTransaction = (
	facade: SymbolFacade,
	account: SymbolAccount,
	params: CreateAggregateTransactionParams
) => {
	const transactionsHash = SymbolFacade.hashEmbeddedTransactions(params.embeddedTransactions);
	const transaction = facade.transactionFactory.create({
		type: params.aggregateType,
		signerPublicKey: account.publicKey,
		fee: 0n,
		deadline: facade.now().addHours(params.deadlineHours).timestamp,
		transactionsHash,
		transactions: params.embeddedTransactions,
		cosignatures: []
	});

	transaction.fee = new models.Amount(BigInt(transaction.size) * BigInt(params.feeMultiplier));

	return { transaction, transactionsHash };
};
