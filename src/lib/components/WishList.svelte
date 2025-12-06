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
	const GARLAND = ['✨', '🎄', '⭐', '🎁', '❄️', '🍬', '🧦', '🕯️'];
	const CONFETTI = Array.from({ length: 30 }, (_, index) => index);

	const polarCode = (wish: Wish, position: number) => {
		const cleaned = wish.title.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
		return `${cleaned || 'WISH'}-${String(position + 1).padStart(2, '0')}`;
	};

	const priorityLabel = (priority: number | null | undefined) => {
		if (priority === 3) return 'Blizzard urgent';
		if (priority === 1) return 'Cozy dream';
		return 'Soon-ish';
	};

	const progressWidth = (priority: number | null | undefined) => {
		const level = typeof priority === 'number' ? priority : 2;
		return `${Math.min(100, level * 28 + 25)}%`;
	};
</script>

<div class="card wish-card">
	<div class="wish-card__halo" aria-hidden="true"></div>
	<div class="wish-card__garland" aria-hidden="true">
		{#each GARLAND as icon, index}
			<span style={`--index:${index}`}>{icon}</span>
		{/each}
	</div>
	<div class="card-header">
		<div class="card-heading">
			<div>
				<p class="pill pill--frosted">{isOwnerView ? 'North Pole HQ' : 'Secret Santa Mode'}</p>
				<h3>{isOwnerView ? 'My wishlist' : viewingUserName ? `${viewingUserName}'s wishlist` : 'Wishlist'}</h3>
				<p class="wish-card__tagline">
					{isOwnerView ? 'Tracking every sparkly desire' : 'Sleigh manifest loaded – stealth mode engaged'}
				</p>
			</div>
			{#if loading}
				<span class="muted text-sm">Loading…</span>
			{/if}
		</div>
		{#if isOwnerView && onAdd}
			<button class="btn btn--primary" onclick={onAdd}>🎁 Add wish</button>
		{/if}
	</div>
	<p class="wish-card__subtitle">
		{#if isOwnerView}
			Hang on to your dream gifts and keep them sparkling until delivery night.
		{:else}
			Sneak a peek at {viewingUserName}'s wishes and reserve the perfect surprise.
		{/if}
	</p>

	{#if !wishes.length && !loading}
		<p class="muted wish-empty">No wishes yet. Add the first present under the tree!</p>
	{:else}
		<ul class="wish-list">
			{#each wishes as wish, index (wish.id)}
				{@const purchase = purchaseFor(wish.id)}
				{@const code = polarCode(wish, index)}
				<li class="wish" class:purchased={Boolean(purchase)}>
					<div class="wish-ribbon" aria-hidden="true">
						<span>🎀</span>
					</div>
					{#if !isOwnerView && purchase}
						<span class="wish-owner-chip">{purchase.user_id === identityUserId ? 'You claimed this' : 'Elf already in route'}</span>
					{/if}
					<div class="wish-confetti" aria-hidden="true">
						{#each CONFETTI as confetti}
							<span style={`--index:${confetti}`}></span>
						{/each}
					</div>
					<div class="wish-beacon" aria-hidden="true"></div>
					<div class="wish-scanlines" aria-hidden="true"></div>
					<div class="wish-main">
						<div>
							<p class="wish-title">{wish.title}</p>
							{#if wish.link}
								<a class="wish-link" href={wish.link} target="_blank" rel="noreferrer">Visit gift page ↗</a>
							{/if}
							<p class="wish-priority">
								<span>Priority sparkle</span>
								<span class="wish-priority__stars">{priorityStars(wish.priority)}</span>
							</p>
							<div class="wish-meta">
								<span class="wish-meta__item">
									<label>Polar code</label>
									<strong>{code}</strong>
								</span>
								<span class="wish-meta__item">
									<label>Status</label>
									<strong>{priorityLabel(wish.priority)}</strong>
								</span>
								<span class="wish-meta__item">
									<label>Owner</label>
									<strong>{isOwnerView ? 'You' : viewingUserName}</strong>
								</span>
							</div>
							<div class="wish-progress">
								<span style={`width:${progressWidth(wish.priority)}`}></span>
							</div>
						</div>
						<div class="wish-actions">
							{#if canEdit}
								<button class="btn btn--ghost" onclick={() => onEdit(wish)}>Edit ✏️</button>
								<button class="btn btn--danger" onclick={() => onDelete(wish.id)}>Remove ❌</button>
							{:else if !isOwnerView}
								{#if purchase}
									<button class="btn" onclick={() => onTogglePurchased(wish.id)} disabled={purchase.user_id !== identityUserId}>
										{purchase.user_id === identityUserId ? 'Release' : 'Reserved'}
									</button>
								{:else}
									<button class="btn btn--primary" onclick={() => onTogglePurchased(wish.id)}>Claim surprise 🎅</button>
								{/if}
							{/if}
						</div>
					</div>
					{#if !isOwnerView && purchase}
						<p class="pill">Elf reserved</p>
					{/if}
					<div class="wish-sensors">
						<p>
							<span>✨ Signal</span>
							<strong>{progressWidth(wish.priority)}</strong>
						</p>
						<p>
							<span>🎧 Broadcast</span>
							<strong>{purchase ? 'Silent stealth' : 'Carols loud'}</strong>
						</p>
						<p>
							<span>🧭 Route</span>
							<strong>{purchase ? 'Locked' : 'Scanning'}</strong>
						</p>
					</div>
				</li>
			{/each}
		</ul>
		<div class="wish-stats">
			<div>
				<p class="muted text-sm">Live sparkle index</p>
				<p class="wish-stats__value">98%</p>
				<p class="wish-stats__note">Based on priority + reservation velocity</p>
			</div>
			<div>
				<p class="muted text-sm">Gifts in queue</p>
				<p class="wish-stats__value">{wishes.length}</p>
				<p class="wish-stats__note">Every wish is synced to SantaNet</p>
			</div>
			<div>
				<p class="muted text-sm">Reserved</p>
				<p class="wish-stats__value">{purchased.length}</p>
				<p class="wish-stats__note">{!isOwnerView ? 'Keep it secret!' : 'Friends are on the case'}</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.wish-card {
		position: relative;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.card-heading {
		display: flex;
		align-items: flex-start;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.wish-card__tagline {
		font-size: 0.95rem;
		color: rgba(15, 44, 36, 0.75);
		margin: -0.1rem 0 0;
	}

	.wish-card__subtitle {
		color: rgba(15, 44, 36, 0.7);
		margin-top: -0.35rem;
	}

	.wish-card__halo {
		position: absolute;
		inset: -20% 10% auto;
		height: 200px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.6), transparent 55%);
		filter: blur(10px);
		z-index: 0;
	}

	.wish-card__garland {
		position: absolute;
		top: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 90%;
		display: flex;
		justify-content: space-between;
		font-size: 1.2rem;
		opacity: 0.65;
		pointer-events: none;
	}

	.wish-card__garland span {
		animation: floaty 5s ease-in-out infinite;
		animation-delay: calc(var(--index) * 0.25s);
	}

	.pill--frosted {
		background: rgba(255, 255, 255, 0.65);
		border: 1px solid rgba(255, 255, 255, 0.5);
		color: var(--color-primary);
		margin: 0 0 0.2rem;
	}

	.wish-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		position: relative;
		z-index: 1;
	}

	.wish {
		border: 1px solid var(--color-border);
		padding: 1.1rem;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		background: var(--color-surface-alt);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
	}

	.wish.purchased {
		border-color: rgba(15, 44, 36, 0.3);
		opacity: 0.95;
	}

	.wish .pill {
		align-self: flex-start;
		background: rgba(34, 197, 94, 0.12);
		border: 1px solid rgba(34, 197, 94, 0.35);
		color: #0f5132;
		position: relative;
		z-index: 2;
	}

	.wish-main {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		align-items: center;
		position: relative;
		z-index: 2;
	}

	.wish-title {
		font-weight: 700;
		margin: 0 0 0.25rem 0;
	}

	.wish-link {
		color: var(--color-primary);
		font-weight: 600;
		font-size: 0.95rem;
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
	}

	.wish-priority {
		display: inline-flex;
		gap: 0.35rem;
		align-items: center;
		font-size: 0.9rem;
		color: var(--color-muted);
	}

	.wish-priority__stars {
		font-size: 1.2rem;
		color: #f97316;
	}

	.wish-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 0.4rem 0 0.2rem;
	}

	.wish-meta__item {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 10px;
		padding: 0.35rem 0.6rem;
		border: 1px dashed rgba(0, 0, 0, 0.1);
		min-width: 120px;
	}

	.wish-meta__item label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(15, 44, 36, 0.6);
	}

	.wish-meta__item strong {
		font-size: 0.95rem;
	}

	.wish-progress {
		width: 100%;
		height: 8px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.08);
		overflow: hidden;
		position: relative;
	}

	.wish-progress span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #34d399, #facc15, #d7263d);
		box-shadow: 0 0 12px rgba(215, 38, 61, 0.5);
	}

	.wish-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.wish-ribbon {
		position: absolute;
		top: -30px;
		right: -20px;
		background: linear-gradient(135deg, rgba(215, 38, 61, 0.85), rgba(255, 166, 158, 0.8));
		padding: 1.2rem 2.8rem 0.35rem;
		transform: rotate(35deg);
		color: #fff;
		font-weight: 700;
		font-size: 1.2rem;
		opacity: 0.25;
	}

	.wish-owner-chip {
		position: absolute;
		top: 0.8rem;
		left: 0.8rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: rgba(34, 197, 94, 0.12);
		color: #0f5132;
		font-size: 0.75rem;
		font-weight: 700;
		z-index: 2;
	}

	.wish-confetti {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.wish-confetti span {
		position: absolute;
		width: 6px;
		height: 12px;
		top: -20%;
		left: calc(var(--index) * 3%);
		border-radius: 2px;
		background: hsl(calc(var(--index) * 12), 80%, 70%);
		animation: confetti-fall 5s linear infinite;
		animation-delay: calc(var(--index) * -0.23s);
		opacity: 0.6;
	}

	.wish-beacon {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.25), transparent 55%);
		z-index: 0;
		mix-blend-mode: screen;
		animation: pulse 6s ease-in-out infinite;
		pointer-events: none;
	}

	.wish-scanlines {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px);
		background-size: 100% 8px;
		opacity: 0.25;
		pointer-events: none;
	}

	.wish-empty {
		text-align: center;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.4);
		border-radius: 14px;
	}

	.wish-stats {
		margin-top: 1.4rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.65);
		border-radius: 18px;
		border: 1px dashed rgba(215, 38, 61, 0.4);
		box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.4);
	}

	.wish-stats__value {
		font-size: 2rem;
		font-weight: 800;
		margin: 0.2rem 0 0.1rem;
		color: var(--color-primary);
	}

	.wish-stats__note {
		font-size: 0.85rem;
		color: rgba(15, 44, 36, 0.7);
		margin: 0;
	}

	.wish-sensors {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.35rem;
		background: rgba(255, 255, 255, 0.45);
		border-radius: 12px;
		padding: 0.6rem 0.75rem;
		border: 1px dashed rgba(0, 0, 0, 0.1);
		font-size: 0.85rem;
	}

	.wish-sensors span {
		color: rgba(15, 44, 36, 0.6);
		font-size: 0.75rem;
		display: block;
	}

	.wish-sensors strong {
		font-size: 1rem;
	}

	@keyframes floaty {
		0%,
		100% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-6px);
		}
	}

	@keyframes confetti-fall {
		0% {
			transform: translateY(0) rotate(0deg);
		}

		100% {
			transform: translateY(220px) rotate(540deg);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.35;
		}

		50% {
			opacity: 0.8;
		}
	}
</style>
