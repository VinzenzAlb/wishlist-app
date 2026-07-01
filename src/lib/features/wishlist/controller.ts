import {
	fetchPurchasesFor,
	fetchUsers,
	fetchWishes,
	insertPurchase,
	insertWish,
	removePurchase,
	removeWish,
	updateWish
} from '$lib/services/wishlistService';
import type { Purchased, SortMode, User, Wish, WishInput } from '$lib/types';
import { clearCookie, readCookie, writeCookie } from '$lib/utils/cookies';
import { sanitizeWishLink } from './utils';
import { derived, get, writable } from 'svelte/store';

const INITIAL_FORM: WishInput = { title: '', link: '', priority: 2 };
const IDENTITY_COOKIE_NAME = 'wishlist-identity';
const IDENTITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const FILTER_COOKIE_NAME = 'wishlist-filters';

type FilterCookieValue = {
	sortMode?: SortMode;
	friendViewId?: string;
	showOnlyAvailable?: boolean;
};

function isSortModeValue(value: unknown): value is SortMode {
	return value === 'priority' || value === 'created_at' || value === 'title';
}

function readFilterCookie(): FilterCookieValue | null {
	const raw = readCookie(FILTER_COOKIE_NAME);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		const filters: FilterCookieValue = {};
		if (isSortModeValue(parsed.sortMode)) {
			filters.sortMode = parsed.sortMode;
		}
		if (typeof parsed.friendViewId === 'string') {
			filters.friendViewId = parsed.friendViewId;
		}
		if (typeof parsed.showOnlyAvailable === 'boolean') {
			filters.showOnlyAvailable = parsed.showOnlyAvailable;
		}
		return filters;
	} catch {
		return null;
	}
}

function writeFilterCookie(filters: FilterCookieValue) {
	writeCookie(FILTER_COOKIE_NAME, JSON.stringify(filters), { maxAge: IDENTITY_COOKIE_MAX_AGE });
}

function clearFilterCookie() {
	clearCookie(FILTER_COOKIE_NAME);
}

export function createWishlistController() {
	const users = writable<User[]>([]);
	const identityUserId = writable('');
	const viewingUserId = writable('');
	const pendingUserId = writable('');

	const wishes = writable<Wish[]>([]);
	const purchased = writable<Purchased[]>([]);
	const sortMode = writable<SortMode>('priority');
	const activeView = writable<'home' | 'friends'>('home');
	const showOnlyAvailable = writable(false);

	const loadingUsers = writable(true);
	const loadingWishes = writable(false);
	const error = writable<string | null>(null);
	const info = writable<string | null>(null);

	const form = writable<WishInput>({ ...INITIAL_FORM });
	const editingWishId = writable<string | null>(null);
	const showModal = writable(false);
	const saving = writable(false);
	const showDeleteModal = writable(false);
	const deleteTarget = writable<Wish | null>(null);
	const deleting = writable(false);

	// Live updates via polling while the tab is visible (replaces Supabase Realtime).
	const POLL_INTERVAL_MS = 5000;
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let visibilityHandler: (() => void) | null = null;
	let polledUserId = '';

	let filterPrefs: FilterCookieValue = readFilterCookie() ?? {};

	const canEdit = derived([viewingUserId, identityUserId], ([$viewing, $identity]) =>
		Boolean($viewing && $viewing === $identity)
	);
	const isOwnerView = canEdit;
	const viewingUserName = derived([users, viewingUserId], ([$users, $viewing]) =>
		findUserName($users, $viewing)
	);
	const identityUserName = derived([users, identityUserId], ([$users, $identity]) =>
		findUserName($users, $identity)
	);
	const friendOptions = derived([users, identityUserId], ([$users, $identity]) =>
		$users.filter((u) => u.id !== $identity)
	);

	if (filterPrefs.sortMode) {
		sortMode.set(filterPrefs.sortMode);
	} else {
		filterPrefs.sortMode = get(sortMode);
	}
	if (typeof filterPrefs.showOnlyAvailable === 'boolean') {
		showOnlyAvailable.set(filterPrefs.showOnlyAvailable);
	} else {
		filterPrefs.showOnlyAvailable = get(showOnlyAvailable);
	}

	function persistFilterPrefs(update: Partial<FilterCookieValue>) {
		filterPrefs = { ...filterPrefs, ...update };
		writeFilterCookie(filterPrefs);
	}

	sortMode.subscribe((mode) => {
		persistFilterPrefs({ sortMode: mode });
	});
	showOnlyAvailable.subscribe((value) => {
		persistFilterPrefs({ showOnlyAvailable: value });
	});

	const storedIdentity = readCookie(IDENTITY_COOKIE_NAME);
	if (storedIdentity) {
		identityUserId.set(storedIdentity);
		viewingUserId.set(storedIdentity);
		pendingUserId.set(storedIdentity);
		void loadDataFor(storedIdentity);
	}

	function findUserName(list: User[], id: string) {
		return id ? (list.find((u) => u.id === id)?.name ?? 'Unbekannt') : 'Unbekannt';
	}

	function setForm(next: WishInput) {
		form.set(next);
	}

	function stopPolling() {
		if (pollTimer) clearInterval(pollTimer);
		pollTimer = null;
		if (visibilityHandler && typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', visibilityHandler);
		}
		visibilityHandler = null;
		polledUserId = '';
	}

	function upsertWish(wish: Wish) {
		wishes.update((list) => {
			const index = list.findIndex((w) => w.id === wish.id);
			return index !== -1 ? list.toSpliced(index, 1, wish) : [...list, wish];
		});
	}

	function upsertPurchase(purchase: Purchased) {
		purchased.update((list) => {
			const index = list.findIndex((p) => p.wish_id === purchase.wish_id);
			return index !== -1 ? list.toSpliced(index, 1, purchase) : [...list, purchase];
		});
	}

	function startPolling(userId: string) {
		if (polledUserId === userId && pollTimer) return;
		stopPolling();
		polledUserId = userId;
		if (typeof document === 'undefined') return;

		const refresh = () => {
			if (document.visibilityState === 'visible' && polledUserId) {
				void loadDataFor(polledUserId, { silent: true });
			}
		};
		pollTimer = setInterval(refresh, POLL_INTERVAL_MS);
		// Refetch immediately when the tab regains focus, so a viewer sees changes
		// (e.g. an item marked as bought) as soon as they come back to the page.
		visibilityHandler = refresh;
		document.addEventListener('visibilitychange', visibilityHandler);
	}

	async function loadUsers() {
		loadingUsers.set(true);
		const { data, error: err } = await fetchUsers();
		if (err) {
			error.set(err.message);
		} else {
			users.set(data ?? []);
		}
		loadingUsers.set(false);
	}

	async function loadDataFor(userId: string, { silent = false }: { silent?: boolean } = {}) {
		// Silent refreshes (polling) update the data in place without toggling the
		// loading spinner or surfacing transient errors.
		if (!silent) {
			loadingWishes.set(true);
			error.set(null);
		}
		const { data: wishData, error: wishErr } = await fetchWishes(userId);
		if (wishErr) {
			if (!silent) {
				error.set(wishErr.message);
				loadingWishes.set(false);
			}
			return;
		}

		wishes.set(wishData ?? []);

		const wishIds = (wishData ?? []).map((w) => w.id);
		const { data: purchasedRows, error: purchasedErr } = await fetchPurchasesFor(wishIds);
		if (purchasedErr) {
			if (!silent) {
				error.set(purchasedErr.message);
				purchased.set([]);
			}
		} else {
			purchased.set(purchasedRows ?? []);
		}

		if (!silent) loadingWishes.set(false);
	}

	async function handleContinue() {
		error.set(null);
		const pending = get(pendingUserId);
		if (!pending) {
			error.set('Wähle eine Person aus, um fortzufahren.');
			return;
		}
		identityUserId.set(pending);
		viewingUserId.set(pending);
		activeView.set('home');
		writeCookie(IDENTITY_COOKIE_NAME, pending, { maxAge: IDENTITY_COOKIE_MAX_AGE });
		await loadDataFor(pending);
	}

	async function handleViewChange(newUserId: string) {
		viewingUserId.set(newUserId);
		persistFilterPrefs({ friendViewId: newUserId });
		// Polling restarts for the new viewer via the reactive startPolling($viewingUserId).
		await loadDataFor(newUserId);
	}

	function resetForm() {
		form.set({ ...INITIAL_FORM });
		editingWishId.set(null);
	}

	function startEdit(wish: Wish) {
		editingWishId.set(wish.id);
		form.set({
			title: wish.title,
			link: wish.link ?? '',
			priority: wish.priority ?? 2
		});
		showModal.set(true);
	}

	function startAdd() {
		resetForm();
		showModal.set(true);
	}

	function startDelete(wish: Wish) {
		deleteTarget.set(wish);
		showDeleteModal.set(true);
	}

	function cancelDelete() {
		deleteTarget.set(null);
		showDeleteModal.set(false);
	}

	async function saveWish() {
		error.set(null);
		const currentView = get(viewingUserId);
		const currentIdentity = get(identityUserId);
		const currentForm = get(form);

		if (!currentView || !currentIdentity) {
			error.set('Wähle zuerst, wer du bist.');
			return;
		}
		if (!currentForm.title.trim()) {
			error.set('Bitte gib einen Titel ein.');
			return;
		}

		saving.set(true);

		const priority = Math.min(3, Math.max(1, Number(currentForm.priority ?? 2)));
		const sanitizedLink = sanitizeWishLink(currentForm.link);
		if (currentForm.link && !sanitizedLink) {
			error.set('Bitte gib einen gültigen Link mit http(s) an.');
			saving.set(false);
			return;
		}
		const payload: WishInput = { title: currentForm.title.trim(), link: sanitizedLink, priority };
		const editingId = get(editingWishId);

		if (editingId) {
			const { data, error: err } = await updateWish(editingId, payload);
			if (err) {
				error.set(err.message);
			} else if (data) {
				upsertWish(data as Wish);
				info.set('Wunsch aktualisiert.');
				resetForm();
				showModal.set(false);
			}
		} else {
			const { data, error: err } = await insertWish(currentView, payload);
			if (err) {
				error.set(err.message);
			} else if (data) {
				upsertWish(data as Wish);
				info.set('Wunsch hinzugefügt.');
				resetForm();
				showModal.set(false);
			}
		}
		saving.set(false);
	}

	async function deleteWish() {
		const target = get(deleteTarget);
		if (!target) return;
		error.set(null);
		deleting.set(true);
		const { error: err } = await removeWish(target.id);
		if (err) {
			error.set(err.message);
		} else {
			wishes.update((list) => list.filter((w) => w.id !== target.id));
			purchased.update((list) => list.filter((p) => p.wish_id !== target.id));
			info.set('Wunsch gelöscht.');
			cancelDelete();
		}
		deleting.set(false);
	}

	async function togglePurchased(wishId: string) {
		const currentIdentity = get(identityUserId);
		const ownerView = get(isOwnerView);

		if (!currentIdentity) {
			error.set('Wähle zuerst, wer du bist.');
			return;
		}

		if (ownerView) {
			error.set('Du kannst deinen eigenen Wunsch nicht als gekauft markieren.');
			return;
		}

		const existing = get(purchased).find((p) => p.wish_id === wishId);
		if (existing) {
			if (existing.user_id !== currentIdentity) {
				error.set('Nur wer markiert hat, kann die Markierung wieder lösen.');
				return;
			}

			const { error: err } = await removePurchase(existing.id);
			if (err) {
				error.set(err.message);
			} else {
				purchased.update((list) => list.filter((p) => p.id !== existing.id));
				info.set('Markierung aufgehoben.');
			}
			return;
		}

		const { data, error: err } = await insertPurchase(wishId, currentIdentity);
		if (err) {
			error.set(err.message);
		} else if (data) {
			upsertPurchase(data as Purchased);
			info.set('Als gekauft markiert.');
		}
	}

	function goHome() {
		activeView.set('home');
		const identity = get(identityUserId);
		viewingUserId.set(identity);
		if (identity) {
			loadDataFor(identity);
		}
		showModal.set(false);
	}

	async function goFriends() {
		activeView.set('friends');
		const options = get(friendOptions);
		if (!options.length) {
			info.set('Noch keine Freunde hinzugefügt.');
			return;
		}

		const identity = get(identityUserId);
		const hasOption = (id: string | null | undefined) =>
			Boolean(id && options.some((o) => o.id === id));
		let target = get(viewingUserId);
		if (!hasOption(target) || target === identity) {
			const preferred = filterPrefs.friendViewId;
			if (preferred && hasOption(preferred)) {
				target = preferred;
			} else {
				target = options[0].id;
			}
			viewingUserId.set(target);
		}
		persistFilterPrefs({ friendViewId: target });
		await loadDataFor(target);
	}

	function resetSelection() {
		stopPolling();
		identityUserId.set('');
		viewingUserId.set('');
		pendingUserId.set('');
		wishes.set([]);
		purchased.set([]);
		form.set({ ...INITIAL_FORM });
		editingWishId.set(null);
		activeView.set('home');
		showModal.set(false);
		showDeleteModal.set(false);
		deleteTarget.set(null);
		deleting.set(false);
		error.set(null);
		info.set(null);
		clearCookie(IDENTITY_COOKIE_NAME);
		filterPrefs = {};
		clearFilterCookie();
	}

	return {
		stores: {
			users,
			identityUserId,
			viewingUserId,
			pendingUserId,
			wishes,
			purchased,
			sortMode,
			activeView,
			showOnlyAvailable,
			loadingUsers,
			loadingWishes,
			error,
			info,
			form,
			editingWishId,
			showModal,
			saving,
			showDeleteModal,
			deleteTarget,
			deleting
		},
		derived: {
			canEdit,
			isOwnerView,
			viewingUserName,
			identityUserName,
			friendOptions
		},
		actions: {
			loadUsers,
			handleContinue,
			handleViewChange,
			goHome,
			goFriends,
			resetSelection,
			startEdit,
			startAdd,
			resetForm,
			saveWish,
			startDelete,
			cancelDelete,
			deleteWish,
			togglePurchased,
			setForm,
			startPolling,
			stopPolling
		}
	};
}
