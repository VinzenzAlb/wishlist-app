import type { SortMode, Wish } from '$lib/types';

const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:']);

export function sortWishes(list: Wish[], mode: SortMode) {
	return [...list].sort((a, b) => {
		if (mode === 'priority') {
			const priorityDelta = (b.priority ?? 0) - (a.priority ?? 0);
			if (priorityDelta !== 0) return priorityDelta;
			return new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf();
		}
		if (mode === 'title') {
			return a.title.localeCompare(b.title);
		}
		return new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf();
	});
}

export function priorityStars(priority: number | null) {
	return '★'.repeat(Math.max(1, Math.min(3, priority ?? 1)));
}

export function sanitizeWishLink(input: string | null | undefined) {
	if (!input) return null;
	const value = input.trim();
	if (!value) return null;
	try {
		const parsed = new URL(value);
		if (!ALLOWED_LINK_PROTOCOLS.has(parsed.protocol)) {
			return null;
		}
		parsed.hash = '';
		return parsed.toString();
	} catch {
		return null;
	}
}
