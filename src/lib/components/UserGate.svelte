<script lang="ts">
	import type { User } from '$lib/types';

	let { users, loading, pendingUserId, onContinue, onSelect } = $props<{
		users: User[];
		loading: boolean;
		pendingUserId: string;
		onContinue: () => void;
		onSelect: (id: string) => void;
	}>();
</script>

<section class="gate">
	<div class="panel gate-panel">
		<h1>Wishlist</h1>
		<p class="muted">Pick your name to load your wishlist. No login needed.</p>

		<label class="form-field">
			<span>Who are you?</span>
			<select class="input" value={pendingUserId} disabled={loading} onchange={(e) => onSelect((e.target as HTMLSelectElement).value)}>
				<option value="">Select your name</option>
				{#if loading}
					<option disabled>Loading users...</option>
				{:else}
					{#each users as user}
						<option value={user.id}>{user.name}</option>
					{/each}
				{/if}
			</select>
		</label>

		<button class="btn btn--primary" onclick={onContinue} disabled={!pendingUserId}>Continue</button>
	</div>
</section>

<style>
	section.gate {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background: linear-gradient(135deg, #e0f2fe, #f5f3ff);
	}

	.gate-panel {
		width: min(420px, 100%);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h1 {
		margin: 0;
	}
</style>
