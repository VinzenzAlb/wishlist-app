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
</script>

<header class="card header">
	<div class="identity">
		<p class="muted text-sm">You are</p>
		<h2>{identityUserName}</h2>
		<button class="btn btn--ghost" onclick={onReset}>Change user</button>
	</div>
	<div class="select-row">
		<label class="form-field">
			<span>Viewing wishlist for</span>
			<select class="input" value={viewingUserId} onchange={(e) => onChangeView((e.target as HTMLSelectElement).value)}>
				{#each users as user}
					<option value={user.id}>{user.name}</option>
				{/each}
			</select>
		</label>
		<label class="form-field">
			<span>Sort by</span>
			<select class="input" value={sortMode} onchange={(e) => onChangeSort((e.target as HTMLSelectElement).value as SortMode)}>
				<option value="priority">Priority</option>
				<option value="created_at">Date created</option>
				<option value="title">Alphabetical</option>
			</select>
		</label>
	</div>
</header>

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
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
</style>
