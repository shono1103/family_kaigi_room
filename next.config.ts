import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	serverExternalPackages: ["symbol-sdk", "symbol-crypto-wasm-node"],
};

export default nextConfig;
