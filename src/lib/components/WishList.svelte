<script lang="ts">
	import { priorityStars } from '$lib/services/wishlistService';
	import type { Purchased, Wish } from '$lib/types';

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
			onAdd
		} = $props<{
			wishes: Wish[];
			purchased: Purchased[];
			isOwnerView: boolean;
			canEdit: boolean;
			viewingUserName: string;
			identityUserId: string;
			loading: boolean;
			onEdit: (wish: Wish) => void;
			onDelete: (wishId: string) => void;
			onTogglePurchased: (wishId: string) => void;
			onAdd?: () => void;
		}>();

	const purchaseFor = (wishId: string) => purchased.find((p: Purchased) => p.wish_id === wishId);
</script>

<div class="card wish-card">
	<div class="card-header">
		<div class="card-heading">
			<h3>{isOwnerView ? 'My wishlist' : viewingUserName ? `${viewingUserName}'s wishlist` : 'Wishlist'}</h3>
			{#if loading}
				<span class="muted text-sm">Loading…</span>
			{/if}
		</div>
		{#if isOwnerView && onAdd}
			<button class="btn btn--primary" onclick={onAdd}>+ Add wish</button>
		{/if}
	</div>

	{#if !wishes.length && !loading}
		<p class="muted">No wishes yet.</p>
	{:else}
		<ul class="wish-list">
			{#each wishes as wish}
				{@const purchase = purchaseFor(wish.id)}
				<li class="wish">
					<div class="wish-main">
						<div>
							<p class="wish-title">{wish.title}</p>
							{#if wish.link}
								<a class="muted text-sm" href={wish.link} target="_blank" rel="noreferrer">Open link</a>
							{/if}
							<p class="muted text-sm">Priority: {priorityStars(wish.priority)}</p>
						</div>
						<div class="wish-actions">
							{#if canEdit}
								<button class="btn btn--ghost" onclick={() => onEdit(wish)}>Edit</button>
								<button class="btn btn--danger" onclick={() => onDelete(wish.id)}>Delete</button>
							{:else if !isOwnerView}
								{#if purchase}
									<button class="btn" onclick={() => onTogglePurchased(wish.id)} disabled={purchase.user_id !== identityUserId}>
										{purchase.user_id === identityUserId ? 'Unmark' : 'Purchased'}
									</button>
								{:else}
									<button class="btn btn--primary" onclick={() => onTogglePurchased(wish.id)}>Mark purchased</button>
								{/if}
							{/if}
						</div>
					</div>
					{#if !isOwnerView && purchase}
						<p class="pill">Purchased</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
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
</style>
