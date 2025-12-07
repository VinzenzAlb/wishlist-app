type CookieOptions = {
	maxAge?: number;
	path?: string;
	sameSite?: 'Lax' | 'Strict' | 'None';
};

const DEFAULT_OPTIONS: Required<Pick<CookieOptions, 'path' | 'sameSite'>> = {
	path: '/',
	sameSite: 'Lax'
};

export function readCookie(name: string) {
	if (typeof document === 'undefined') return null;
	const entry = document.cookie
		.split(';')
		.map((value) => value.trim())
		.find((value) => value.startsWith(`${name}=`));
	if (!entry) return null;
	const raw = entry.slice(name.length + 1);
	return raw ? decodeURIComponent(raw) : null;
}

export function writeCookie(name: string, value: string, options: CookieOptions = {}) {
	if (typeof document === 'undefined') return;
	const config = { ...DEFAULT_OPTIONS, ...options };
	const parts = [`${name}=${encodeURIComponent(value)}`];
	if (config.maxAge !== undefined) {
		parts.push(`Max-Age=${config.maxAge}`);
	}
	parts.push(`Path=${config.path}`);
	parts.push(`SameSite=${config.sameSite}`);
	document.cookie = parts.join('; ');
}

export function clearCookie(name: string) {
	if (typeof document === 'undefined') return;
	document.cookie = `${name}=; Max-Age=0; Path=${DEFAULT_OPTIONS.path}; SameSite=${DEFAULT_OPTIONS.sameSite}`;
}
