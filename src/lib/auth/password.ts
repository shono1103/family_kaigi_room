import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_PREFIX = "scrypt";

export function hashPassword(password: string): string {
	const salt = randomBytes(SCRYPT_SALT_BYTES);
	const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);

	return [
		SCRYPT_PREFIX,
		salt.toString("hex"),
		derivedKey.toString("hex"),
	].join("$");
}

export function verifyPassword(password: string, storedHash: string): boolean {
	const [scheme, saltHex, keyHex] = storedHash.split("$");
	if (!scheme || !saltHex || !keyHex) {
		return false;
	}
	if (scheme !== SCRYPT_PREFIX) {
		return false;
	}

	const salt = Buffer.from(saltHex, "hex");
	const expectedKey = Buffer.from(keyHex, "hex");
	const actualKey = scryptSync(password, salt, expectedKey.length);

	if (actualKey.length !== expectedKey.length) {
		return false;
	}

	return timingSafeEqual(actualKey, expectedKey);
}
