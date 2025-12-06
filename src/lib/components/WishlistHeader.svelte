<script lang="ts">
	import type { SortMode, User } from '$lib/types';
	import Icon from './Icon.svelte';

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
</script>

<header class="card header">
	<div class="header-wrapper">
		<div class="identity">
			<p class="muted text-sm">Du bist</p>
			<h2>{identityUserName}</h2>
		</div>
		<button class="btn btn--ghost" onclick={onReset} aria-label="Abmelden" title="Abmelden">
			<Icon name="logout" size={18} />
			<span>Abmelden</span>
		</button>
	</div>
	<div class="select-row">
		<label class="form-field">
			<span>Wunschliste von</span>
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
			<span>Sortieren nach</span>
			<select
				class="input"
				value={sortMode}
				onchange={(e) => onChangeSort((e.target as HTMLSelectElement).value as SortMode)}
			>
				<option value="priority">Priorität</option>
				<option value="created_at">Erstellungsdatum</option>
				<option value="title">Alphabetisch</option>
			</select>
		</label>
	</div>
</header>

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
		justify-content: space-between;
		padding: 1.1rem 1.4rem;
	}

	.identity {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	h2 {
		margin: 0;
	}

	.select-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-wrapper {
		display: flex;
		justify-content: space-between;
	}
</style>
