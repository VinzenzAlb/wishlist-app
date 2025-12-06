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
		<h1>Wunschliste</h1>
		<p class="muted">Wähle deinen Namen, um deine Wunschliste zu laden. Kein Login nötig.</p>

		<label class="form-field">
			<span>Wer bist du?</span>
			<select class="input" value={pendingUserId} disabled={loading} onchange={(e) => onSelect((e.target as HTMLSelectElement).value)}>
				<option value="">Wähle deinen Namen</option>
				{#if loading}
					<option disabled>Lade Personen…</option>
				{:else}
					{#each users as user}
						<option value={user.id}>{user.name}</option>
					{/each}
				{/if}
			</select>
		</label>

		<button class="btn btn--primary" onclick={onContinue} disabled={!pendingUserId}>Weiter</button>
	</div>
</section>

<style>
	section.gate {
		flex: 1;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background: var(--bg-body);
		width: 100%;
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
