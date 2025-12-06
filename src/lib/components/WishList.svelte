<script lang="ts">
	import { priorityStars, sortWishes } from '$lib/services/wishlistService';
	import type { Purchased, SortMode, Wish } from '$lib/types';
	import Icon from './Icon.svelte';

let {
		wishes,
		purchased,
		isOwnerView,
		canEdit,
		viewingUserName,
		identityUserId,
		loading,
		onEdit,
		onDelete,
		onTogglePurchased,
		onAdd,
		sortMode,
		onChangeSort,
		showOnlyAvailable,
		onChangeAvailability
	} = $props<{
		wishes: Wish[];
		purchased: Purchased[];
		isOwnerView: boolean;
		canEdit: boolean;
		viewingUserName: string;
		identityUserId: string;
		loading: boolean;
		onEdit: (wish: Wish) => void;
		onDelete: (wish: Wish) => void;
		onTogglePurchased: (wishId: string) => void;
		onAdd?: () => void;
		sortMode: SortMode;
		onChangeSort: (mode: SortMode) => void;
		showOnlyAvailable: boolean;
		onChangeAvailability: (availableOnly: boolean) => void;
	}>();

	const purchaseFor = (wishId: string) => purchased.find((p: Purchased) => p.wish_id === wishId);
	const orderedWishes = $derived(() => sortWishes(wishes, sortMode));
	const visibleWishes = $derived(() => {
		const list = orderedWishes();
		if (isOwnerView || !showOnlyAvailable) {
			return list;
		}
		return list.filter((wish) => !purchaseFor(wish.id));
	});
	const placeholderItems = $derived(() => {
		const visibleCount = visibleWishes().length;
		const fallbackCount = orderedWishes().length;
		const base = visibleCount || fallbackCount || 0;
		const normalized = Math.max(3, Math.min(base || 3, 6));
		return Array.from({ length: normalized });
	});
	const allowedProtocols = new Set(['http:', 'https:']);

	const safeLink = (value: string | null) => {
		if (!value) return null;
		try {
			const parsed = new URL(value);
			if (!allowedProtocols.has(parsed.protocol)) {
				return null;
			}
			parsed.hash = '';
			return parsed.toString();
		} catch {
			return null;
		}
	};
</script>



<div class="card wish-card">
	<div class="card-header">
		<div class="card-heading">
			<h3>{isOwnerView ? 'Meine Wunschliste' : viewingUserName ? `Wunschliste von ${viewingUserName}` : 'Wunschliste'}</h3>
			{#if loading}
				<span class="muted text-sm">Wird geladen…</span>
			{/if}
		</div>
		<div class="card-controls">
			{#if !isOwnerView}
				<label class="sort-control">
					<span>Verfügbarkeit</span>
					<select
						class="input sort-select"
						value={showOnlyAvailable ? 'available' : 'all'}
						onchange={(e) => {
							const value = (e.target as HTMLSelectElement).value;
							onChangeAvailability(value === 'available');
						}}
					>
						<option value="all">Alle Wünsche</option>
						<option value="available">Nur verfügbare</option>
					</select>
				</label>
			{/if}
			<label class="sort-control">
				<span>Sortieren nach</span>
				<select
					class="input sort-select"
					value={sortMode}
					onchange={(e) => onChangeSort((e.target as HTMLSelectElement).value as SortMode)}
				>
					<option value="priority">Priorität</option>
					<option value="created_at">Erstellungsdatum</option>
					<option value="title">Alphabetisch</option>
				</select>
			</label>
			{#if isOwnerView && onAdd}
				<button class="btn btn--primary btn-icon" onclick={onAdd} aria-label="Wunsch hinzufügen" title="Wunsch hinzufügen">
					<Icon name="plus" size={18} />
					<span class="sr-only">Wunsch hinzufügen</span>
				</button>
			{/if}
		</div>
	</div>

	{#if !visibleWishes().length && !loading}
		<p class="muted">{showOnlyAvailable && !isOwnerView ? 'Gerade nichts verfügbar.' : 'Noch keine Wünsche.'}</p>
	{:else}
		{#if loading}
			<ul class="wish-list wish-list--placeholder" aria-live="polite">
				{#each placeholderItems() as _, index (index)}
					{@const primaryWidth = 60 + ((index % 3) * 10)}
					{@const secondaryWidth = 40 + (((index + 1) % 3) * 15)}
					<li class="wish wish--placeholder">
						<div class="wish-main">
							<div class="wish-placeholder-text">
								<div class="skeleton skeleton-title" style={`width: ${primaryWidth}%`}></div>
								<div class="skeleton skeleton-line" style={`width: ${secondaryWidth}%`}></div>
								<div class="skeleton skeleton-line skeleton-line--short"></div>
							</div>
							<div class="wish-placeholder-actions">
								<div class="skeleton skeleton-button"></div>
								<div class="skeleton skeleton-button skeleton-button--ghost"></div>
							</div>
						</div>
						<div class="skeleton skeleton-pill"></div>
					</li>
				{/each}
			</ul>
		{:else}
			<ul class="wish-list">
				{#each visibleWishes() as wish}
					{@const purchase = purchaseFor(wish.id)}
					{@const link = safeLink(wish.link)}
					<li class="wish">
						<div class="wish-main">
							<div>
								<p class="wish-title">{wish.title}</p>
								{#if link}
									<a class="muted text-sm" href={link} target="_blank" rel="noreferrer noopener">Link öffnen</a>
								{/if}
								<p class="muted text-sm">Priorität: {priorityStars(wish.priority)}</p>
							</div>
							<div class="wish-actions">
								{#if canEdit}
									<button
										class="btn btn--ghost btn-icon"
										onclick={() => onEdit(wish)}
										aria-label={`Wunsch "${wish.title}" bearbeiten`}
										title={`Wunsch "${wish.title}" bearbeiten`}
									>
										<Icon name="edit" size={18} />
										<span class="sr-only">Wunsch "{wish.title}" bearbeiten</span>
									</button>
								<button
									class="btn btn--danger btn-icon"
									onclick={() => onDelete(wish)}
										aria-label={`Wunsch "${wish.title}" löschen`}
										title={`Wunsch "${wish.title}" löschen`}
									>
										<Icon name="trash" size={18} />
										<span class="sr-only">Wunsch "{wish.title}" löschen</span>
									</button>
								{:else if !isOwnerView}
									{#if purchase}
										<button class="btn" onclick={() => onTogglePurchased(wish.id)} disabled={purchase.user_id !== identityUserId}>
											{purchase.user_id === identityUserId ? 'Markierung entfernen' : 'Schon von jemand anderem reserviert'}
										</button>
									{:else}
										<button class="btn btn--primary" onclick={() => onTogglePurchased(wish.id)}>Als gekauft markieren</button>
									{/if}
								{/if}
							</div>
						</div>
						{#if !isOwnerView && purchase}
							<p class="pill">{purchase.user_id === identityUserId ? 'Von dir gekauft' : 'Gekauft'}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.card-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: flex-end;
		gap: 0.6rem;
	}

	.sort-control {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.85rem;
		text-align: right;
	}

	.sort-select {
		min-width: 150px;
	}


	.card-heading {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
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
		border: 1px solid var(--color-border);
		padding: 0.9rem;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		background: var(--color-surface-alt);
	}

	.wish .pill {
		align-self: flex-start;
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

	.wish-list--placeholder {
		animation: fadeIn 150ms ease;
	}

	.wish--placeholder {
		border-color: transparent;
		background: var(--color-surface);
		box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
	}

	.wish-placeholder-text {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: 100%;
	}

	.wish-placeholder-actions {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.skeleton {
		display: block;
		height: 0.8rem;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--color-border), var(--color-border-strong), var(--color-border));
		background-size: 200% 100%;
		animation: skeleton-slide 1.3s ease infinite;
	}

	.skeleton-title {
		height: 1.1rem;
	}

	.skeleton-line--short {
		width: 35%;
	}

	.skeleton-button {
		width: 120px;
		height: 2.4rem;
		border-radius: var(--radius-md);
	}

	.skeleton-button--ghost {
		width: 48px;
	}

	.skeleton-pill {
		width: 130px;
		height: 1.6rem;
		border-radius: 999px;
	}

	@keyframes skeleton-slide {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
