<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { onDestroy, onMount } from 'svelte';

	export const ssr = false;

	type User = {
		id: string;
		name: string;
	};

	type Wish = {
		id: string;
		user_id: string;
		title: string;
		link: string | null;
		priority: number | null;
		created_at: string;
		updated_at: string;
	};

	type Purchased = {
		id: string;
		user_id: string;
		wish_id: string;
		created_at: string;
	};

	type SortMode = 'priority' | 'created_at' | 'title';

	let users: User[] = [];
	let identityUserId = ''; // "I am" selection
	let viewingUserId = ''; // whose wishlist is being viewed

	let wishes: Wish[] = [];
	let purchased: Purchased[] = [];
	let sortMode: SortMode = 'priority';

	let loadingUsers = true;
	let loadingWishes = false;
	let error: string | null = null;
	let info: string | null = null;

	let pendingUserId = ''; // first-screen selection

	let wishlistChannel: ReturnType<typeof supabase.channel> | null = null;
	let purchasedChannel: ReturnType<typeof supabase.channel> | null = null;

	let form = {
		title: '',
		link: '',
		priority: 0
	};
	let editingWishId: string | null = null;

	onMount(() => {
		loadUsers();
	});

	onDestroy(() => {
		wishlistChannel?.unsubscribe();
		purchasedChannel?.unsubscribe();
	});

	$: if (viewingUserId) {
		setupRealtime(viewingUserId);
	}

	$: sortedWishes = [...wishes].sort((a, b) => {
		if (sortMode === 'priority') {
			return (a.priority ?? 0) - (b.priority ?? 0) || new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf();
		}
		if (sortMode === 'title') {
			return a.title.localeCompare(b.title);
		}
		return new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf();
	});

	const findUserName = (id: string) => (id ? users.find((u) => u.id === id)?.name ?? 'Unknown' : 'Unknown');
	const purchaseFor = (wishId: string) => purchased.find((p) => p.wish_id === wishId);

	async function loadUsers() {
		loadingUsers = true;
		const { data, error: err } = await supabase.from('users').select('id, name').order('name');
		if (err) {
			error = err.message;
		} else {
			users = data ?? [];
		}
		loadingUsers = false;
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

	function resetSelection() {
		wishlistChannel?.unsubscribe();
		purchasedChannel?.unsubscribe();
		wishlistChannel = null;
		purchasedChannel = null;
		identityUserId = '';
		viewingUserId = '';
		pendingUserId = '';
		wishes = [];
		purchased = [];
	}

	async function loadDataFor(userId: string) {
		loadingWishes = true;
		error = null;
		const { data: wishData, error: wishErr } = await supabase.from('wishes').select('*').eq('user_id', userId);
		if (wishErr) {
			error = wishErr.message;
			loadingWishes = false;
			return;
		}

		wishes = wishData ?? [];

		const wishIds = wishes.map((w) => w.id);
		if (wishIds.length) {
			const { data: purchasedRows, error: purchasedErr } = await supabase.from('purchased').select('*').in('wish_id', wishIds);
			if (purchasedErr) {
				error = purchasedErr.message;
			} else {
				purchased = purchasedRows ?? [];
			}
		} else {
			purchased = [];
		}

		loadingWishes = false;
	}

	async function handleViewChange(newUserId: string) {
		viewingUserId = newUserId;
		wishlistChannel?.unsubscribe();
		purchasedChannel?.unsubscribe();
		wishlistChannel = null;
		purchasedChannel = null;
		await loadDataFor(newUserId);
	}

	function setupRealtime(userId: string) {
		if (wishlistChannel && wishlistChannel.topic === `wishes-${userId}`) return;

		wishlistChannel?.unsubscribe();
		wishlistChannel = supabase.channel(`wishes-${userId}`);
		wishlistChannel
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'wishes', filter: `user_id=eq.${userId}` },
				(payload) => {
					if (payload.eventType === 'INSERT' && payload.new) {
						wishes = [...wishes, payload.new as Wish];
					} else if (payload.eventType === 'UPDATE' && payload.new) {
						wishes = wishes.map((w) => (w.id === payload.new.id ? (payload.new as Wish) : w));
					} else if (payload.eventType === 'DELETE' && payload.old) {
						wishes = wishes.filter((w) => w.id !== payload.old.id);
						purchased = purchased.filter((p) => p.wish_id !== payload.old.id);
					}
				}
			)
			.subscribe();

		purchasedChannel?.unsubscribe();
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
						purchased = [...purchased.filter((p) => p.wish_id !== record.wish_id), payload.new as Purchased];
					} else if (payload.eventType === 'UPDATE' && payload.new) {
						purchased = purchased.map((p) => (p.id === record.id ? (payload.new as Purchased) : p));
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

		if (editingWishId) {
			const { error: err } = await supabase
				.from('wishes')
				.update({ title: form.title.trim(), link: form.link.trim() || null, priority: Number(form.priority ?? 0) })
				.eq('id', editingWishId);
			if (err) {
				error = err.message;
			} else {
				info = 'Wish updated.';
				resetForm();
			}
		} else {
			const { error: err } = await supabase.from('wishes').insert({
				title: form.title.trim(),
				link: form.link.trim() || null,
				priority: Number(form.priority ?? 0),
				user_id: viewingUserId
			});
			if (err) {
				error = err.message;
			} else {
				info = 'Wish added.';
				resetForm();
			}
		}
	}

	function resetForm() {
		form = { title: '', link: '', priority: 0 };
		editingWishId = null;
	}

	function startEdit(wish: Wish) {
		editingWishId = wish.id;
		form = {
			title: wish.title,
			link: wish.link ?? '',
			priority: wish.priority ?? 0
		};
	}

	async function deleteWish(id: string) {
		error = null;
		const { error: err } = await supabase.from('wishes').delete().eq('id', id);
		if (err) {
			error = err.message;
		} else {
			info = 'Wish deleted.';
		}
	}

	async function togglePurchased(wishId: string) {
		if (!identityUserId) {
			error = 'Select who you are first.';
			return;
		}
		const existing = purchased.find((p) => p.wish_id === wishId);
		if (existing) {
			const { error: err } = await supabase.from('purchased').delete().eq('id', existing.id);
			if (err) {
				error = err.message;
			} else {
				info = 'Marked as not purchased.';
			}
			return;
		}

		const { error: err } = await supabase.from('purchased').insert({
			wish_id: wishId,
			user_id: identityUserId
		});
		if (err) {
			error = err.message;
		} else {
			info = 'Marked as purchased.';
		}
	}

	$: canEdit = Boolean(viewingUserId && viewingUserId === identityUserId);
	$: viewingUserName = findUserName(viewingUserId);
	$: identityUserName = findUserName(identityUserId);
</script>

{#if !identityUserId}
	<section class="gate">
		<div class="panel">
			<h1>Wishlist</h1>
			<p class="muted">Pick your name to load your wishlist. No login needed.</p>

			<label>
				<span>Who are you?</span>
				<select bind:value={pendingUserId} disabled={loadingUsers}>
					<option value="">Select your name</option>
					{#if loadingUsers}
						<option disabled>Loading users...</option>
					{:else}
						{#each users as user}
							<option value={user.id}>{user.name}</option>
						{/each}
					{/if}
				</select>
			</label>

			<button class="primary" on:click={handleContinue} disabled={!pendingUserId}>Continue</button>
			{#if error}
				<p class="error">{error}</p>
			{/if}
		</div>
	</section>
{:else}
	<section class="page">
		<header>
			<div>
				<p class="muted small">You are</p>
				<h2>{identityUserName}</h2>
				<button class="link" on:click={resetSelection}>Change user</button>
			</div>
			<div class="select-row">
				<label>
					<span>Viewing wishlist for</span>
					<select bind:value={viewingUserId} on:change={(e) => handleViewChange((e.target as HTMLSelectElement).value)}>
						{#each users as user}
							<option value={user.id}>{user.name}</option>
						{/each}
					</select>
				</label>
				<label>
					<span>Sort by</span>
					<select bind:value={sortMode}>
						<option value="priority">Priority</option>
						<option value="created_at">Date created</option>
						<option value="title">Alphabetical</option>
					</select>
				</label>
			</div>
		</header>

		{#if error}
			<p class="error">{error}</p>
		{/if}
		{#if info}
			<p class="info">{info}</p>
		{/if}

		<section class="board">
			<div class="column">
				<div class="card">
					<div class="card-header">
						<h3>{viewingUserName}'s wishes</h3>
						{#if loadingWishes}
							<span class="muted small">Loading…</span>
						{/if}
					</div>

					{#if !sortedWishes.length && !loadingWishes}
						<p class="muted">No wishes yet.</p>
					{:else}
						<ul class="wish-list">
							{#each sortedWishes as wish}
								<li class="wish">
									<div class="wish-main">
										<div>
											<p class="wish-title">{wish.title}</p>
											{#if wish.link}
												<a class="muted small" href={wish.link} target="_blank" rel="noreferrer">Open link</a>
											{/if}
											<p class="muted small">Priority: {wish.priority ?? 0}</p>
										</div>
										<div class="wish-actions">
											<button on:click={() => togglePurchased(wish.id)}>
												{#if purchased.find((p) => p.wish_id === wish.id)}
													Unmark
												{:else}
													Mark purchased
												{/if}
											</button>
											{#if canEdit}
												<button on:click={() => startEdit(wish)}>Edit</button>
												<button class="danger" on:click={() => deleteWish(wish.id)}>Delete</button>
											{/if}
										</div>
									</div>
									{#if purchaseFor(wish.id)}
										{#if viewingUserId === identityUserId}
											<p class="pill">Purchased</p>
										{:else}
											<p class="pill">Purchased by {findUserName(purchaseFor(wish.id)?.user_id ?? '')}</p>
										{/if}
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>

			<div class="column">
				<div class="card">
					<div class="card-header">
						<h3>{editingWishId ? 'Edit wish' : 'Add a wish'}</h3>
						{#if !canEdit}
							<span class="muted small">Switch to {viewingUserName} to edit.</span>
						{/if}
					</div>
					<div class="form">
						<label>
							<span>Title *</span>
							<input placeholder="Trip to Japan" bind:value={form.title} />
						</label>
						<label>
							<span>Link</span>
							<input placeholder="https://example.com" bind:value={form.link} />
						</label>
						<label>
							<span>Priority (lower = higher)</span>
							<input type="number" bind:value={form.priority} />
						</label>
						<div class="form-actions">
							<button class="primary" on:click={saveWish} disabled={!canEdit}>
								{editingWishId ? 'Update wish' : 'Add wish'}
							</button>
							{#if editingWishId}
								<button class="link" on:click={resetForm}>Cancel</button>
							{/if}
						</div>
					</div>
				</div>
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

	section.gate {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background: linear-gradient(135deg, #e0f2fe, #f5f3ff);
	}

	.panel {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
		width: min(420px, 100%);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h1,
	h2,
	h3 {
		margin: 0;
	}

	.muted {
		color: #475569;
	}

	.small {
		font-size: 0.9rem;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1rem;
		justify-content: space-between;
	}

	.select-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-weight: 600;
		color: #0f172a;
	}

	select,
	input {
		padding: 0.65rem 0.8rem;
		border-radius: 10px;
		border: 1px solid #cbd5e1;
		font-size: 1rem;
		outline: none;
		background: #fff;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	select:focus,
	input:focus {
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
	}

	button {
		border: none;
		border-radius: 10px;
		padding: 0.65rem 0.95rem;
		font-weight: 600;
		cursor: pointer;
		background: #e2e8f0;
		color: #0f172a;
		transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.2s ease;
	}

	button:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.primary {
		background: linear-gradient(135deg, #2563eb, #4f46e5);
		color: white;
	}

	.danger {
		background: #fee2e2;
		color: #991b1b;
	}

	.link {
		background: transparent;
		color: #2563eb;
		padding-left: 0;
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

	.card {
		background: #fff;
		border-radius: 14px;
		padding: 1.25rem;
		box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.wish-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.wish {
		border: 1px solid #e2e8f0;
		padding: 0.9rem;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		background: #f8fafc;
	}

	.wish-main {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.wish-title {
		font-weight: 700;
		margin: 0 0 0.2rem 0;
	}

	.wish-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.pill {
		display: inline-flex;
		align-self: flex-start;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		background: #e0f2fe;
		color: #0b5394;
		font-weight: 600;
		font-size: 0.95rem;
	}

	.error {
		color: #b91c1c;
		margin: 0.25rem 0 0;
	}

	.info {
		color: #166534;
		margin: 0.25rem 0 0;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
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

		.wish-main {
			align-items: flex-start;
		}
	}
</style>
