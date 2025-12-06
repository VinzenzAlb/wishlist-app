import { fetchPurchasesFor, fetchUsers, fetchWishes, insertPurchase, insertWish, removePurchase, removeWish, sortWishes, updateWish } from '$lib/services/wishlistService';
import { supabase } from '$lib/supabaseClient';
import type { Purchased, SortMode, User, Wish, WishInput } from '$lib/types';
import { derived, get, writable } from 'svelte/store';

const INITIAL_FORM: WishInput = { title: '', link: '', priority: 2 };

export function createWishlistController() {
	const users = writable<User[]>([]);
	const identityUserId = writable('');
	const viewingUserId = writable('');
	const pendingUserId = writable('');

	const wishes = writable<Wish[]>([]);
	const purchased = writable<Purchased[]>([]);
	const sortMode = writable<SortMode>('priority');
	const activeView = writable<'home' | 'friends'>('home');

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

	const sortedWishes = derived([wishes, sortMode], ([$wishes, $sortMode]) => sortWishes($wishes, $sortMode));
	const canEdit = derived([viewingUserId, identityUserId], ([$viewing, $identity]) => Boolean($viewing && $viewing === $identity));
	const isOwnerView = canEdit;
	const viewingUserName = derived([users, viewingUserId], ([$users, $viewing]) => findUserName($users, $viewing));
	const identityUserName = derived([users, identityUserId], ([$users, $identity]) => findUserName($users, $identity));
	const friendOptions = derived([users, identityUserId], ([$users, $identity]) => $users.filter((u) => u.id !== $identity));

	function findUserName(list: User[], id: string) {
		return id ? list.find((u) => u.id === id)?.name ?? 'Unknown' : 'Unknown';
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
			error.set('Choose a user to continue.');
			return;
		}
		identityUserId.set(pending);
		viewingUserId.set(pending);
		activeView.set('home');
		await loadDataFor(pending);
	}

	async function handleViewChange(newUserId: string) {
		viewingUserId.set(newUserId);
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
			error.set('Select who you are first.');
			return;
		}
		if (!currentForm.title.trim()) {
			error.set('Title is required.');
			return;
		}

		saving.set(true);

		const priority = Math.min(3, Math.max(1, Number(currentForm.priority ?? 2)));
		const link = currentForm.link ? currentForm.link.trim() : '';
		const payload: WishInput = { title: currentForm.title.trim(), link: link || null, priority };
		const editingId = get(editingWishId);

		if (editingId) {
			const { data, error: err } = await updateWish(editingId, payload);
			if (err) {
				error.set(err.message);
			} else if (data) {
				upsertWish(data as Wish);
				info.set('Wish updated.');
				resetForm();
				showModal.set(false);
			}
		} else {
			const { data, error: err } = await insertWish(currentView, payload);
			if (err) {
				error.set(err.message);
			} else if (data) {
				upsertWish(data as Wish);
				info.set('Wish added.');
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
			info.set('Wish deleted.');
		}
	}

	async function togglePurchased(wishId: string) {
		const currentIdentity = get(identityUserId);
		const ownerView = get(isOwnerView);

		if (!currentIdentity) {
			error.set('Select who you are first.');
			return;
		}

		if (ownerView) {
			error.set('You cannot mark your own wish as purchased.');
			return;
		}

		const existing = get(purchased).find((p) => p.wish_id === wishId);
		if (existing) {
			if (existing.user_id !== currentIdentity) {
				error.set('Only the person who marked this can unmark it.');
				return;
			}

			const { error: err } = await removePurchase(existing.id);
			if (err) {
				error.set(err.message);
			} else {
				purchased.update((list) => list.filter((p) => p.id !== existing.id));
				info.set('Marked as not purchased.');
			}
			return;
		}

		const { data, error: err } = await insertPurchase(wishId, currentIdentity);
		if (err) {
			error.set(err.message);
		} else if (data) {
			upsertPurchase(data as Purchased);
			info.set('Marked as purchased.');
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
			info.set('No friends added yet.');
			return;
		}

		let target = get(viewingUserId);
		if (!target || target === get(identityUserId)) {
			target = options[0].id;
			viewingUserId.set(target);
		}
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
			sortedWishes,
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
