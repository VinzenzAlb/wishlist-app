<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import UserGate from '$lib/components/UserGate.svelte';
	import WishForm from '$lib/components/WishForm.svelte';
	import WishList from '$lib/components/WishList.svelte';
	import WishlistHeader from '$lib/components/WishlistHeader.svelte';
	import { createWishlistController } from '$lib/features/wishlist/controller';
	import { onDestroy, onMount } from 'svelte';

	export const ssr = false;

	const {
		stores: {
			users,
			identityUserId,
			viewingUserId,
			pendingUserId,
			purchased,
			sortMode,
			activeView,
			loadingUsers,
			loadingWishes,
			error,
			info,
			form,
			editingWishId,
			showModal,
			saving
		},
		derived: { sortedWishes, canEdit, isOwnerView, viewingUserName, identityUserName, friendOptions },
		actions: {
			loadUsers,
			handleContinue,
			handleViewChange,
			goHome,
			goFriends,
			resetSelection,
			startEdit,
			startAdd,
			resetForm,
			saveWish,
			deleteWish,
			togglePurchased,
			setForm,
			setupRealtime,
			unsubscribeRealtime
		}
	} = createWishlistController();

	onMount(() => {
		loadUsers();
	});

	onDestroy(unsubscribeRealtime);

	$: if ($viewingUserId) setupRealtime($viewingUserId);
</script>

{#if !$identityUserId}
	<UserGate users={$users} loading={$loadingUsers} pendingUserId={$pendingUserId} onSelect={(id) => pendingUserId.set(id)} onContinue={handleContinue} />
{:else}
	<section class="page">
		<div class="topbar">
			<div class="tabs">
				<button class="tab" class:active={$activeView === 'home'} onclick={goHome}>My list</button>
				<button class="tab" class:active={$activeView === 'friends'} onclick={goFriends}>Friends</button>
			</div>
			{#if $activeView === 'home'}
				<button class="btn btn--primary add" onclick={startAdd}>+ Add wish</button>
			{/if}
		</div>

		{#if $activeView === 'friends'}
			<WishlistHeader
				identityUserName={$identityUserName}
				viewingUserId={$viewingUserId}
				viewingUserName={$viewingUserName}
				users={$friendOptions}
				sortMode={$sortMode}
				onChangeSort={(mode) => sortMode.set(mode)}
				onChangeView={handleViewChange}
				onReset={resetSelection}
			/>
		{:else}
			<div class="home-meta">
				<p class="muted text-sm">You are</p>
				<h2>{$identityUserName}</h2>
				<p class="muted">Manage your wishlist here. Others can see it from Friends.</p>
			</div>
		{/if}

		{#if $error}
			<p class="message message--error">{$error}</p>
		{/if}
		{#if $info}
			<p class="message message--info">{$info}</p>
		{/if}

		<section class="board">
			<WishList
				wishes={$sortedWishes}
				purchased={$purchased}
				isOwnerView={$isOwnerView}
				canEdit={$canEdit}
				identityUserId={$identityUserId}
				loading={$loadingWishes}
				onEdit={startEdit}
				onDelete={deleteWish}
				onTogglePurchased={togglePurchased}
			/>
		</section>
	</section>
{/if}

<footer class="page-footer">
	<ThemeToggle />
</footer>

<Modal open={$showModal} title={$editingWishId ? 'Edit wish' : 'Add wish'} onClose={() => showModal.set(false)}>
	<WishForm form={$form} onSave={saveWish} onReset={() => (showModal.set(false), resetForm())} onChange={setForm} saving={$saving} />
</Modal>

<style>
	section.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0 1.75rem 1.25rem;
	}

	.tabs {
		display: inline-flex;
		background: var(--color-border);
		border-radius: 14px;
		padding: 0.2rem;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
	}

	.tab {
		border: none;
		background: transparent;
		padding: 0.7rem 1.2rem;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 700;
		color: var(--color-text);
		transition: transform 120ms ease, box-shadow 120ms ease, background 150ms ease;
	}

	.tab:hover {
		transform: translateY(-1px);
	}

	.tab.active {
		background: var(--color-surface);
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
	}

	.add {
		border-radius: 12px;
		box-shadow: 0 12px 30px rgba(37, 99, 235, 0.25);
		font-weight: 700;
	}

	.home-meta {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		background: var(--color-surface);
		padding: 1.2rem 1.35rem;
		border-radius: 16px;
		box-shadow: var(--shadow-soft);
		border: 1px solid var(--color-border);
	}

	.board {
		display: block;
	}

	.page-footer {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem 2.5rem;
	}

	@media (max-width: 640px) {
		section.page {
			padding: 1.5rem 1rem 2rem;
		}

		.topbar {
			padding: 1.25rem;
		}

		.page-footer {
			padding: 0 1rem 1.75rem;
		}
	}
</style>
