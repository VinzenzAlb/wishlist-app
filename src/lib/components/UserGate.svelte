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
	<div class="panel">
		<h1>Wishlist</h1>
		<p class="muted">Pick your name to load your wishlist. No login needed.</p>

		<label>
			<span>Who are you?</span>
			<select value={pendingUserId} disabled={loading} onchange={(e) => onSelect((e.target as HTMLSelectElement).value)}>
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

		<button class="primary" onclick={onContinue} disabled={!pendingUserId}>Continue</button>
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

	.panel {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
		width: min(420px, 100%);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h1 {
		margin: 0;
	}

	.muted {
		color: #475569;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-weight: 600;
		color: #0f172a;
	}

	select {
		padding: 0.65rem 0.8rem;
		border-radius: 10px;
		border: 1px solid #cbd5e1;
		font-size: 1rem;
		outline: none;
		background: #fff;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	select:focus {
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
	}

	button {
		border: none;
		border-radius: 10px;
		padding: 0.65rem 0.95rem;
		font-weight: 600;
		cursor: pointer;
		background: linear-gradient(135deg, #2563eb, #4f46e5);
		color: white;
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
</style>
