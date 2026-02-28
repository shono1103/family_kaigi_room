type AuthErrorMessageProps = {
	message: string | null;
};

export function AuthErrorMessage({ message }: AuthErrorMessageProps) {
	if (!message) {
		return null;
	}

	return (
		<p className="rounded-2xl border border-[#ff4fa3]/20 bg-[#fff1f8] px-4 py-3 text-sm text-[#9c2d6a]">
			{message}
		</p>
	);
}
