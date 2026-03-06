export type UpdateMosaicParams = Readonly<{
	mosaicIdHex: string;
}>;

export const updateMosaic = async (
	_params: UpdateMosaicParams
): Promise<never> => {
	throw new Error('updateMosaic is not implemented yet.');
};
