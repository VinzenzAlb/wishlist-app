import { fetchPurchasesFor, fetchUsers, fetchWishes, insertPurchase, insertWish, removePurchase, removeWish, updateWish } from '$lib/services/wishlistService';
import { supabase } from '$lib/supabaseClient';
import type { Purchased, SortMode, User, Wish, WishInput } from '$lib/types';
import { derived, get, writable } from 'svelte/store';

const INITIAL_FORM: WishInput = { title: '', link: '', priority: 2 };
const IDENTITY_COOKIE_NAME = 'wishlist-identity';
const IDENTITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const FILTER_COOKIE_NAME = 'wishlist-filters';
const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:']);

type FilterCookieValue = {
	sortMode?: SortMode;
	friendViewId?: string;
	showOnlyAvailable?: boolean;
};

function readIdentityCookie() {
	if (typeof document === 'undefined') return null;
	const target = document.cookie
		.split(';')
		.map((entry) => entry.trim())
		.find((entry) => entry.startsWith(`${IDENTITY_COOKIE_NAME}=`));
	if (!target) return null;
	const value = target.substring(IDENTITY_COOKIE_NAME.length + 1);
	return value ? decodeURIComponent(value) : null;
}

function writeIdentityCookie(id: string) {
	if (typeof document === 'undefined') return;
	document.cookie = `${IDENTITY_COOKIE_NAME}=${encodeURIComponent(id)}; Max-Age=${IDENTITY_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function clearIdentityCookie() {
	if (typeof document === 'undefined') return;
	document.cookie = `${IDENTITY_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function isSortModeValue(value: unknown): value is SortMode {
	return value === 'priority' || value === 'created_at' || value === 'title';
}

function readFilterCookie(): FilterCookieValue | null {
	if (typeof document === 'undefined') return null;
	const target = document.cookie
		.split(';')
		.map((entry) => entry.trim())
		.find((entry) => entry.startsWith(`${FILTER_COOKIE_NAME}=`));
	if (!target) return null;
	const raw = target.substring(FILTER_COOKIE_NAME.length + 1);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
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
	if (typeof document === 'undefined') return;
	document.cookie = `${FILTER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(filters))}; Max-Age=${IDENTITY_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function clearFilterCookie() {
	if (typeof document === 'undefined') return;
	document.cookie = `${FILTER_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function sanitizeWishLink(input: string | null | undefined) {
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

	let wishlistChannel: ReturnType<typeof supabase.channel> | null = null;
	let purchasedChannel: ReturnType<typeof supabase.channel> | null = null;

	let filterPrefs: FilterCookieValue = readFilterCookie() ?? {};

	const canEdit = derived([viewingUserId, identityUserId], ([$viewing, $identity]) => Boolean($viewing && $viewing === $identity));
	const isOwnerView = canEdit;
	const viewingUserName = derived([users, viewingUserId], ([$users, $viewing]) => findUserName($users, $viewing));
	const identityUserName = derived([users, identityUserId], ([$users, $identity]) => findUserName($users, $identity));
	const friendOptions = derived([users, identityUserId], ([$users, $identity]) => $users.filter((u) => u.id !== $identity));

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

	const storedIdentity = readIdentityCookie();
	if (storedIdentity) {
		identityUserId.set(storedIdentity);
		viewingUserId.set(storedIdentity);
		pendingUserId.set(storedIdentity);
		void loadDataFor(storedIdentity);
	}

	function findUserName(list: User[], id: string) {
		return id ? list.find((u) => u.id === id)?.name ?? 'Unbekannt' : 'Unbekannt';
	}

	function setForm(next: WishInput) {
		form.set(next);
	}

	function unsubscribeRealtime() {
		wishlistChannel?.unsubscribe();
		purchasedChannel?.unsubscribe();
		wishlistChannel = null;
		purchasedChannel = null;
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

	function setupRealtime(userId: string) {
		if (wishlistChannel && wishlistChannel.topic === `wishes-${userId}`) return;

		unsubscribeRealtime();
		wishlistChannel = supabase.channel(`wishes-${userId}`);
		wishlistChannel
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'wishes', filter: `user_id=eq.${userId}` },
				(payload) => {
					if (payload.eventType === 'INSERT' && payload.new) {
						upsertWish(payload.new as Wish);
					} else if (payload.eventType === 'UPDATE' && payload.new) {
						upsertWish(payload.new as Wish);
					} else if (payload.eventType === 'DELETE' && payload.old) {
						const wishId = payload.old.id as string;
						wishes.update((list) => list.filter((w) => w.id !== wishId));
						purchased.update((list) => list.filter((p) => p.wish_id !== wishId));
					}
				}
			)
			.subscribe();

		purchasedChannel = supabase.channel(`purchased-${userId}`);
		purchasedChannel
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'purchased' },
				(payload) => {
					const record = (payload.new as Purchased) ?? (payload.old as Purchased);
					if (!record) return;
					if (!get(wishes).find((w) => w.id === record.wish_id)) return;

					if (payload.eventType === 'INSERT' && payload.new) {
						upsertPurchase(payload.new as Purchased);
					} else if (payload.eventType === 'UPDATE' && payload.new) {
						upsertPurchase(payload.new as Purchased);
					} else if (payload.eventType === 'DELETE' && payload.old) {
						const id = record.id;
						purchased.update((list) => list.filter((p) => p.id !== id));
					}
				}
			)
			.subscribe();
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

	async function loadDataFor(userId: string) {
		loadingWishes.set(true);
		error.set(null);
		const { data: wishData, error: wishErr } = await fetchWishes(userId);
		if (wishErr) {
			error.set(wishErr.message);
			loadingWishes.set(false);
			return;
		}

		wishes.set(wishData ?? []);

		const wishIds = (wishData ?? []).map((w) => w.id);
		const { data: purchasedRows, error: purchasedErr } = await fetchPurchasesFor(wishIds);
		if (purchasedErr) {
			error.set(purchasedErr.message);
			purchased.set([]);
		} else {
			purchased.set(purchasedRows ?? []);
		}

		loadingWishes.set(false);
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
		writeIdentityCookie(pending);
		await loadDataFor(pending);
	}

	async function handleViewChange(newUserId: string) {
		viewingUserId.set(newUserId);
		persistFilterPrefs({ friendViewId: newUserId });
		unsubscribeRealtime();
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

	async function deleteWish(id: string) {
		error.set(null);
		const { error: err } = await removeWish(id);
		if (err) {
			error.set(err.message);
		} else {
			wishes.update((list) => list.filter((w) => w.id !== id));
			purchased.update((list) => list.filter((p) => p.wish_id !== id));
			info.set('Wunsch gelöscht.');
		}
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
		const hasOption = (id: string | null | undefined) => Boolean(id && options.some((o) => o.id === id));
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
		unsubscribeRealtime();
		identityUserId.set('');
		viewingUserId.set('');
		pendingUserId.set('');
		wishes.set([]);
		purchased.set([]);
		form.set({ ...INITIAL_FORM });
		editingWishId.set(null);
		activeView.set('home');
		showModal.set(false);
		error.set(null);
		info.set(null);
		clearIdentityCookie();
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
			saving
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
			deleteWish,
			togglePurchased,
			setForm,
			setupRealtime,
			unsubscribeRealtime
		}
	};
}
