<script lang="ts">
	import UserGate from '$lib/components/UserGate.svelte';
	import WishForm from '$lib/components/WishForm.svelte';
	import WishList from '$lib/components/WishList.svelte';
	import WishlistHeader from '$lib/components/WishlistHeader.svelte';
	import { supabase } from '$lib/supabaseClient';
	import {
		fetchPurchasesFor,
		fetchUsers,
		fetchWishes,
		insertPurchase,
		insertWish,
		removePurchase,
		removeWish,
		sortWishes,
		updateWish
	} from '$lib/services/wishlistService';
	import type { Purchased, SortMode, Wish, WishInput } from '$lib/types';
	import { onDestroy, onMount } from 'svelte';

	export const ssr = false;

	let users: { id: string; name: string }[] = [];
	let identityUserId = '';
	let viewingUserId = '';
	let pendingUserId = '';

	let wishes: Wish[] = [];
	let purchased: Purchased[] = [];
	let sortMode: SortMode = 'priority';

	let loadingUsers = true;
	let loadingWishes = false;
	let error: string | null = null;
	let info: string | null = null;

	let form: WishInput = { title: '', link: '', priority: 2 };
	let editingWishId: string | null = null;

	let wishlistChannel: ReturnType<typeof supabase.channel> | null = null;
	let purchasedChannel: ReturnType<typeof supabase.channel> | null = null;

	onMount(loadUsers);
	onDestroy(unsubscribeRealtime);

	$: sortedWishes = sortWishes(wishes, sortMode);
	$: canEdit = Boolean(viewingUserId && viewingUserId === identityUserId);
	$: isOwnerView = canEdit;
	$: viewingUserName = findUserName(viewingUserId);
	$: identityUserName = findUserName(identityUserId);
	$: if (viewingUserId) setupRealtime(viewingUserId);

	const findUserName = (id: string) => (id ? users.find((u) => u.id === id)?.name ?? 'Unknown' : 'Unknown');
	const purchaseFor = (wishId: string) => purchased.find((p) => p.wish_id === wishId);

	function setForm(next: WishInput) {
		form = next;
	}

	function unsubscribeRealtime() {
		wishlistChannel?.unsubscribe();
		purchasedChannel?.unsubscribe();
		wishlistChannel = null;
		purchasedChannel = null;
	}

	async function loadUsers() {
		loadingUsers = true;
		const { data, error: err } = await fetchUsers();
		if (err) {
			error = err.message;
		} else {
			users = data ?? [];
		}
		loadingUsers = false;
	}

	async function loadDataFor(userId: string) {
		loadingWishes = true;
		error = null;
		const { data: wishData, error: wishErr } = await fetchWishes(userId);
		if (wishErr) {
			error = wishErr.message;
			loadingWishes = false;
			return;
		}

		wishes = wishData ?? [];

		const wishIds = wishes.map((w) => w.id);
		const { data: purchasedRows, error: purchasedErr } = await fetchPurchasesFor(wishIds);
		if (purchasedErr) {
			error = purchasedErr.message;
			purchased = [];
		} else {
			purchased = purchasedRows ?? [];
		}

		loadingWishes = false;
	}

	async function handleContinue() {
		error = null;
		if (!pendingUserId) {
			error = 'Choose a user to continue.';
			return;
		}
		identityUserId = pendingUserId;
		viewingUserId = pendingUserId;
		await loadDataFor(viewingUserId);
	}

	async function handleViewChange(newUserId: string) {
		viewingUserId = newUserId;
		unsubscribeRealtime();
		await loadDataFor(newUserId);
	}

	function resetSelection() {
		unsubscribeRealtime();
		identityUserId = '';
		viewingUserId = '';
		pendingUserId = '';
		wishes = [];
		purchased = [];
		form = { title: '', link: '', priority: 2 };
		editingWishId = null;
	}

	function upsertWish(wish: Wish) {
		const index = wishes.findIndex((w) => w.id === wish.id);
		wishes = index !== -1 ? wishes.toSpliced(index, 1, wish) : [...wishes, wish];
	}

	function upsertPurchase(purchase: Purchased) {
		const index = purchased.findIndex((p) => p.wish_id === purchase.wish_id);
		purchased = index !== -1 ? purchased.toSpliced(index, 1, purchase) : [...purchased, purchase];
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
						wishes = wishes.filter((w) => w.id !== payload.old.id);
						purchased = purchased.filter((p) => p.wish_id !== payload.old.id);
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
					if (!wishes.find((w) => w.id === record.wish_id)) return;

					if (payload.eventType === 'INSERT' && payload.new) {
						upsertPurchase(payload.new as Purchased);
					} else if (payload.eventType === 'UPDATE' && payload.new) {
						upsertPurchase(payload.new as Purchased);
					} else if (payload.eventType === 'DELETE' && payload.old) {
						purchased = purchased.filter((p) => p.id !== record.id);
					}
				}
			)
			.subscribe();
	}

	async function saveWish() {
		error = null;
		if (!viewingUserId || !identityUserId) return;
		if (!form.title.trim()) {
			error = 'Title is required.';
			return;
		}

		const priority = Math.min(3, Math.max(1, Number(form.priority ?? 2)));
		const link = form.link ? form.link.trim() : '';
		const payload: WishInput = { title: form.title.trim(), link: link || null, priority };

		if (editingWishId) {
			const { data, error: err } = await updateWish(editingWishId, payload);
			if (err) {
				error = err.message;
			} else if (data) {
				upsertWish(data as Wish);
				info = 'Wish updated.';
				resetForm();
			}
		} else {
			const { data, error: err } = await insertWish(viewingUserId, payload);
			if (err) {
				error = err.message;
			} else if (data) {
				upsertWish(data as Wish);
				info = 'Wish added.';
				resetForm();
			}
		}
	}

	function resetForm() {
		form = { title: '', link: '', priority: 2 };
		editingWishId = null;
	}

	function startEdit(wish: Wish) {
		editingWishId = wish.id;
		form = {
			title: wish.title,
			link: wish.link ?? '',
			priority: wish.priority ?? 2
		};
	}

	async function deleteWish(id: string) {
		error = null;
		const { error: err } = await removeWish(id);
		if (err) {
			error = err.message;
		} else {
			wishes = wishes.filter((w) => w.id !== id);
			purchased = purchased.filter((p) => p.wish_id !== id);
			info = 'Wish deleted.';
		}
	}

	async function togglePurchased(wishId: string) {
		if (!identityUserId) {
			error = 'Select who you are first.';
			return;
		}

		if (isOwnerView) {
			error = 'You cannot mark your own wish as purchased.';
			return;
		}

		const existing = purchaseFor(wishId);
		if (existing) {
			if (existing.user_id !== identityUserId) {
				error = 'Only the person who marked this can unmark it.';
				return;
			}

			const { error: err } = await removePurchase(existing.id);
			if (err) {
				error = err.message;
			} else {
				purchased = purchased.filter((p) => p.id !== existing.id);
				info = 'Marked as not purchased.';
			}
			return;
		}

		const { data, error: err } = await insertPurchase(wishId, identityUserId);
		if (err) {
			error = err.message;
		} else if (data) {
			upsertPurchase(data as Purchased);
			info = 'Marked as purchased.';
		}
	}
</script>

{#if !identityUserId}
	<UserGate users={users} loading={loadingUsers} pendingUserId={pendingUserId} onSelect={(id) => (pendingUserId = id)} onContinue={handleContinue} />
{:else}
	<section class="page">
		<WishlistHeader
			identityUserName={identityUserName}
			viewingUserId={viewingUserId}
			viewingUserName={viewingUserName}
			users={users}
			sortMode={sortMode}
			onChangeSort={(mode) => (sortMode = mode)}
			onChangeView={handleViewChange}
			onReset={resetSelection}
		/>

		{#if error}
			<p class="error">{error}</p>
		{/if}
		{#if info}
			<p class="info">{info}</p>
		{/if}

		<section class="board">
			<div class="column">
				<WishList
					wishes={sortedWishes}
					purchased={purchased}
					isOwnerView={isOwnerView}
					canEdit={canEdit}
					identityUserId={identityUserId}
					loading={loadingWishes}
					onEdit={startEdit}
					onDelete={deleteWish}
					onTogglePurchased={togglePurchased}
				/>
			</div>

			<div class="column">
				<WishForm
					canEdit={canEdit}
					form={form}
					editingWishId={editingWishId}
					onSave={saveWish}
					onReset={resetForm}
					onChange={setForm}
				/>
			</div>
		</section>
	</section>
{/if}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

	:global(body) {
		font-family: 'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif;
		background: radial-gradient(circle at 20% 20%, #f8fbff, #eef2f6);
		color: #0f172a;
		margin: 0;
	}

	section.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1.5rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.error {
		color: #b91c1c;
		margin: 0.25rem 0 0;
	}

	.info {
		color: #166534;
		margin: 0.25rem 0 0;
	}

	.board {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
		align-items: start;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.board {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		section.page {
			padding: 1.25rem 1rem 2rem;
		}
	}
</style>
