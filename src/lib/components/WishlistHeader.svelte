<script lang="ts">
	import type { SortMode, User } from '$lib/types';

let {
	identityUserName,
	viewingUserId,
	viewingUserName,
	users,
	sortMode,
	onChangeSort,
	onChangeView,
	onReset
} = $props<{
	identityUserName: string;
	viewingUserId: string;
	viewingUserName: string;
	users: User[];
	sortMode: SortMode;
	onChangeSort: (mode: SortMode) => void;
	onChangeView: (id: string) => void;
	onReset: () => void;
}>();

const BADGES = ['Blitzen boost active', 'Santa radar locked', 'Friendlist synced'];
</script>

<header class="card header holiday-header">
	<div class="header-glow" aria-hidden="true"></div>
	<div class="header-tinsel" aria-hidden="true">
		<span>⭐</span>
		<span>🎄</span>
		<span>❄️</span>
		<span>🎁</span>
	</div>
	<div class="header-wrapper">
		<div class="identity">
			<p class="muted text-sm">You are</p>
			<h2>{identityUserName}</h2>
			<p class="identity-note">Time to play Santa. Pick a friend and sprinkle joy.</p>
			<div class="identity-badges">
				{#each BADGES as badge}
					<span>{badge}</span>
				{/each}
			</div>
		</div>
		<button class="btn btn--ghost" onclick={onReset}>Change user</button>
	</div>
	<div class="select-row">
		<label class="form-field">
			<span>Viewing wishlist for</span>
			<select
				class="input"
				value={viewingUserId}
				onchange={(e) => onChangeView((e.target as HTMLSelectElement).value)}
			>
				{#each users as user}
					<option value={user.id}>{user.name}</option>
				{/each}
			</select>
		</label>
		<label class="form-field">
			<span>Sort by</span>
			<select
				class="input"
				value={sortMode}
				onchange={(e) => onChangeSort((e.target as HTMLSelectElement).value as SortMode)}
			>
				<option value="priority">Priority</option>
				<option value="created_at">Date created</option>
				<option value="title">Alphabetical</option>
			</select>
		</label>
		<div class="holiday-meter">
			<span>Cheer flux</span>
			<div class="holiday-meter__bar">
				<span style="width: 92%"></span>
			</div>
			<p class="muted text-sm">Reindeer morale excellent</p>
		</div>
	</div>
</header>

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
		justify-content: space-between;
		padding: 1.1rem 1.4rem;
		position: relative;
		overflow: hidden;
	}

	.identity {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	h2 {
		margin: 0;
	}

	.identity-note {
		font-size: 0.9rem;
		color: rgba(15, 44, 36, 0.75);
	}

	.identity-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.identity-badges span {
		border: 1px dashed rgba(215, 38, 61, 0.35);
		border-radius: 999px;
		padding: 0.1rem 0.6rem;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-primary);
		background: rgba(255, 255, 255, 0.5);
	}

	.select-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.holiday-meter {
		min-width: 180px;
		background: rgba(255, 255, 255, 0.55);
		border-radius: 12px;
		padding: 0.6rem 0.75rem;
		border: 1px dashed rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-weight: 600;
	}

	.holiday-meter__bar {
		width: 100%;
		height: 12px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}

	.holiday-meter__bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, #d7263d, #facc15, #34d399);
		box-shadow: 0 0 12px rgba(250, 204, 21, 0.8);
	}

	.header-wrapper {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.holiday-header .header-glow {
		position: absolute;
		inset: -50% auto auto -30%;
		width: 200px;
		height: 200px;
		background: radial-gradient(circle, rgba(255, 230, 179, 0.7), transparent 70%);
		filter: blur(10px);
		z-index: 0;
	}

	.header-tinsel {
		position: absolute;
		inset: 0.6rem 1.2rem auto;
		display: flex;
		gap: 0.4rem;
		font-size: 1.1rem;
		opacity: 0.6;
		pointer-events: none;
	}

	.header-tinsel span {
		animation: sway 4s ease-in-out infinite;
	}

	@keyframes sway {
		0%,
		100% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-6px);
		}
	}
</style>
