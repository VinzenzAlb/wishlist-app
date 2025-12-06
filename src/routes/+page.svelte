<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
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
			wishes,
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
			saving,
			showOnlyAvailable
		},
		derived: { canEdit, isOwnerView, viewingUserName, identityUserName, friendOptions },
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

<div class="page-shell">
	<main class="page-main">
		{#if !$identityUserId}
			<UserGate users={$users} loading={$loadingUsers} pendingUserId={$pendingUserId} onSelect={(id) => pendingUserId.set(id)} onContinue={handleContinue} />
		{:else}
			<section class="page">
				<div class="topbar">
					<div class="tabs">
						<button class="tab" class:active={$activeView === 'home'} onclick={goHome}>Meine Liste</button>
						<button class="tab" class:active={$activeView === 'friends'} onclick={goFriends}>Freunde</button>
					</div>
				</div>

				{#if $activeView === 'friends'}
					<WishlistHeader
						identityUserName={$identityUserName}
						viewingUserId={$viewingUserId}
						viewingUserName={$viewingUserName}
						users={$friendOptions}
						onChangeView={handleViewChange}
						onReset={resetSelection}
					/>
				{:else}
					<div class="home-meta">
						<div class="home-meta-header">
							<div>
								<p class="muted text-sm">Du bist</p>
								<h2>{$identityUserName}</h2>
							</div>
								<button class="btn btn--ghost" onclick={resetSelection} aria-label="Abmelden" title="Abmelden">
									<Icon name="logout" size={18} />
									<span>Abmelden</span>
								</button>
							</div>
						<p class="muted">Verwalte deine Wunschliste hier. Deine Freunde finden sie im Tab Freunde.</p>
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
						wishes={$wishes}
						purchased={$purchased}
						isOwnerView={$isOwnerView}
						canEdit={$canEdit}
						viewingUserName={$viewingUserName}
						identityUserId={$identityUserId}
						loading={$loadingWishes}
						onEdit={startEdit}
						onDelete={deleteWish}
						onTogglePurchased={togglePurchased}
						onAdd={startAdd}
						sortMode={$sortMode}
						onChangeSort={(mode) => sortMode.set(mode)}
						showOnlyAvailable={$showOnlyAvailable}
						onChangeAvailability={(value) => showOnlyAvailable.set(value)}
					/>
				</section>
			</section>
		{/if}
	</main>

	<footer class="page-footer">
		<ThemeToggle />
	</footer>
</div>

<Modal open={$showModal} title={$editingWishId ? 'Wunsch bearbeiten' : 'Wunsch hinzufügen'} onClose={() => showModal.set(false)}>
	<WishForm form={$form} onSave={saveWish} onReset={() => (showModal.set(false), resetForm())} onChange={setForm} saving={$saving} />
</Modal>

<style>
	.page-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.page-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	section.page {
		max-width: 1200px;
		width: 100%;
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

	.home-meta {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: var(--color-surface);
		padding: 1.2rem 1.35rem;
		border-radius: 16px;
		box-shadow: var(--shadow-soft);
		border: 1px solid var(--color-border);
	}

	.home-meta-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.board {
		display: block;
	}

	.page-footer {
		width: 100%;
		padding: 0 1.5rem 2.5rem;
		display: flex;
		justify-content: center;
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
