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

<header>
	<div class="identity">
		<p class="muted small">You are</p>
		<h2>{identityUserName}</h2>
		<button class="link" onclick={onReset}>Change user</button>
	</div>
	<div class="select-row">
		<label>
			<span>Viewing wishlist for</span>
			<select value={viewingUserId} onchange={(e) => onChangeView((e.target as HTMLSelectElement).value)}>
				{#each users as user}
					<option value={user.id}>{user.name}</option>
				{/each}
			</select>
		</label>
		<label>
			<span>Sort by</span>
			<select value={sortMode} onchange={(e) => onChangeSort((e.target as HTMLSelectElement).value as SortMode)}>
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
		background: #fff;
		padding: 1.1rem 1.4rem;
		border-radius: 16px;
		box-shadow: 0 14px 36px rgba(15, 23, 42, 0.12);
		border: 1px solid #e2e8f0;
	}

	.identity {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.muted {
		color: #475569;
	}

	.small {
		font-size: 0.9rem;
	}

	.select-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
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

	button.link {
		background: transparent;
		color: #2563eb;
		padding-left: 0;
		border: none;
		border-radius: 10px;
		cursor: pointer;
	}
</style>
