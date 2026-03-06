export type DeleteMosaicParams = Readonly<{
	mosaicIdHex: string;
}>;

export const deleteMosaic = async (
	_params: DeleteMosaicParams
): Promise<never> => {
	throw new Error('deleteMosaic is not implemented yet.');
};
