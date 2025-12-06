<script lang="ts">
	import { priorityStars } from '$lib/services/wishlistService';
	import type { Purchased, Wish } from '$lib/types';

	let {
		wishes,
		purchased,
		isOwnerView,
		canEdit,
		identityUserId,
		loading,
		onEdit,
		onDelete,
		onTogglePurchased
	} = $props<{
		wishes: Wish[];
		purchased: Purchased[];
		isOwnerView: boolean;
		canEdit: boolean;
		identityUserId: string;
		loading: boolean;
		onEdit: (wish: Wish) => void;
		onDelete: (wishId: string) => void;
		onTogglePurchased: (wishId: string) => void;
	}>();

	const purchaseFor = (wishId: string) => purchased.find((p: Purchased) => p.wish_id === wishId);
</script>

<div class="card">
	<div class="card-header">
		<h3>Wishlist</h3>
		{#if loading}
			<span class="muted small">Loading…</span>
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
								<a class="muted small" href={wish.link} target="_blank" rel="noreferrer">Open link</a>
							{/if}
							<p class="muted small">Priority: {priorityStars(wish.priority)}</p>
						</div>
						<div class="wish-actions">
							{#if canEdit}
								<button onclick={() => onEdit(wish)}>Edit</button>
								<button class="danger" onclick={() => onDelete(wish.id)}>Delete</button>
							{:else if !isOwnerView}
								{#if purchase}
									<button onclick={() => onTogglePurchased(wish.id)} disabled={purchase.user_id !== identityUserId}>
										{purchase.user_id === identityUserId ? 'Unmark' : 'Purchased'}
									</button>
								{:else}
									<button class="primary" onclick={() => onTogglePurchased(wish.id)}>Mark purchased</button>
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
	.muted {
		color: #475569;
	}

	.small {
		font-size: 0.9rem;
	}

	.card {
		background: #fff;
		border-radius: 14px;
		padding: 1.35rem;
		box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border: 1px solid #e2e8f0;
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
</style>
