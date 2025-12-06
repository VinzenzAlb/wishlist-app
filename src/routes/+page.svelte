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

const GARLAND_BULBS = Array.from({ length: 24 }, (_, index) => index);
const ORNAMENTS = ['🎄', '🎁', '⭐', '❄️', '🕯️', '🍪', '🧦', '🛷', '🦌', '🍬', '🌟', '🎅'];
const SLOGANS = [
	'Sparkle protocol online',
	'Elves synced & caffeinated',
	'Coal stock at 0%',
	'Reindeer stretch session complete',
	'Candy canes polished',
	'Snow cannons armed',
	'Wishlist warp speed engaged',
	'North Pole bandwidth optimal',
	'Nice list synced globally'
];
const NORTHERN_LIGHTS = Array.from({ length: 6 }, (_, index) => index);
const SKY_SPARKLES = Array.from({ length: 40 }, (_, index) => index);
const CANDY_TREES = Array.from({ length: 12 }, (_, index) => index);
const LAUNCH_CODES = [
	{ label: 'Drive mode', value: 'Hyperglide v9.2' },
	{ label: 'Gift drop', value: 'Precision Snowfall' },
	{ label: 'Stealth', value: 'Silent Night' },
	{ label: 'Backup plan', value: 'Candy Cane Warp' }
];
const REINDEER_CREW = ['Dasher', 'Dancer', 'Prancer', 'Vixen', 'Comet', 'Cupid', 'Donner', 'Blitzen', 'Rudolph'];
const RADIO_PLAYLIST = [
	{ track: 'Jingle Funk 3000', status: 'Looping' },
	{ track: 'Lo-fi Snowfall', status: 'Queued' },
	{ track: 'Sleigh Bells Bass', status: 'Live' }
];
const SLEIGH_LOG = [
	{ time: '07:30', event: 'Elf briefing', state: 'Complete' },
	{ time: '08:05', event: 'Reindeer diagnostics', state: 'Nominal' },
	{ time: '09:45', event: 'Hot cocoa calibration', state: 'Perfect' },
	{ time: '11:00', event: 'Wishlist sync', state: 'Streaming' },
	{ time: '12:20', event: 'Route forecast', state: 'Aurora clear' }
];

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

<div class="page-shell">
	<div class="holiday-background" aria-hidden="true">
		<div class="holiday-lights">
			{#each GARLAND_BULBS as bulb}
				<span class="holiday-lights__bulb" style={`--index:${bulb}`}></span>
			{/each}
		</div>
		<div class="holiday-ornaments">
			{#each ORNAMENTS as ornament, index}
				<span class="holiday-ornament" style={`--index:${index}`}>{ornament}</span>
			{/each}
		</div>
		<div class="sky-sparkles">
			{#each SKY_SPARKLES as sparkle}
				<span class="sky-sparkle" style={`--index:${sparkle}`}></span>
			{/each}
		</div>
		<div class="candy-forest">
			{#each CANDY_TREES as tree}
				<span class="candy-tree" style={`--index:${tree}`}></span>
			{/each}
		</div>
		<div class="northern-lights">
			{#each NORTHERN_LIGHTS as ribbon}
				<span class="northern-lights__beam" style={`--index:${ribbon}`}></span>
			{/each}
		</div>
		<div class="holiday-drift"></div>
	</div>
	<main class="page-main">
		{#if !$identityUserId}
			<UserGate users={$users} loading={$loadingUsers} pendingUserId={$pendingUserId} onSelect={(id) => pendingUserId.set(id)} onContinue={handleContinue} />
		{:else}
				<section class="page">
					<div class="holiday-marquee" aria-hidden="true">
						<div class="holiday-marquee__track">
							{#each SLOGANS as slogan}
								<span>{slogan}</span>
							{/each}
						</div>
						<div class="holiday-marquee__track">
							{#each SLOGANS as slogan}
								<span>{slogan}</span>
							{/each}
						</div>
					</div>
					<div class="topbar">
						<div class="tabs">
							<button class="tab" class:active={$activeView === 'home'} onclick={goHome}>🎄 My list</button>
							<button class="tab" class:active={$activeView === 'friends'} onclick={goFriends}>🎁 Friends</button>
						</div>
						<div class="holiday-top-info">
							<div class="holiday-signal">
								<span class="signal-dot"></span>
								<span>Santa signal strong</span>
							</div>
							<div class="holiday-countdown">
								<span>Countdown</span>
								<strong>{new Date().getFullYear()} Eve Prep</strong>
							</div>
						</div>
					</div>

					<div class="control-grid">
						<article class="control-card control-card--hero">
							<p class="muted text-sm">Mission control</p>
							<h3>North Pole Ops · Ultra Cheer</h3>
							<ul>
								{#each LAUNCH_CODES as code}
									<li>
										<span>{code.label}</span>
										<strong>{code.value}</strong>
									</li>
								{/each}
							</ul>
						</article>
						<article class="control-card">
							<p class="muted text-sm">Reindeer roster</p>
							<div class="reindeer-grid">
								{#each REINDEER_CREW as deer}
									<span>{deer}</span>
								{/each}
							</div>
							<p class="control-note">All vitals glowing mint.</p>
						</article>
						<article class="control-card">
							<p class="muted text-sm">Broadcast</p>
							<ul class="playlist">
								{#each RADIO_PLAYLIST as track}
									<li>
										<strong>{track.track}</strong>
										<span>{track.status}</span>
									</li>
								{/each}
							</ul>
							<p class="control-note">Volume locked at cozy thunder.</p>
						</article>
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
							<div class="home-meta-header">
								<div>
									<p class="muted text-sm">You are</p>
								<h2>{$identityUserName}</h2>
							</div>
							<button class="btn btn--ghost" onclick={resetSelection}>Change user</button>
						</div>
							<p class="muted holiday-subtext">
								Arrange your wishes like ornaments on the tree. Friends can peek from the Friends tab to spread the cheer.
							</p>
							<div class="holiday-chip-row">
								<span class="holiday-chip">Warm cocoa ready ☕️</span>
								<span class="holiday-chip">Elf workshop online 🧝</span>
								<span class="holiday-chip">Wishlist synced ✨</span>
							</div>
							<div class="holiday-progress">
								<p>Cheer meter</p>
								<div class="holiday-progress__bar">
									<span style="width: 96%"></span>
								</div>
								<p class="muted text-sm">Legendary cheer!</p>
							</div>
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
						viewingUserName={$viewingUserName}
						identityUserId={$identityUserId}
						loading={$loadingWishes}
						onEdit={startEdit}
						onDelete={deleteWish}
						onTogglePurchased={togglePurchased}
						onAdd={startAdd}
					/>
					<div class="celebration-panel">
						<div>
							<p class="muted text-sm">Polar weather</p>
							<p class="celebration-large">❄️ -12°C · Snowburst</p>
						</div>
						<div>
							<p class="muted text-sm">Toy factory queue</p>
							<p class="celebration-large">4,532 gifts in flight 🚀</p>
						</div>
						<div>
							<p class="muted text-sm">Cheer broadcast</p>
							<p class="celebration-large">Now playing: Sleigh Bells Bass Boost</p>
						</div>
					</div>
					<div class="sleigh-log">
						<p class="muted text-sm">Live sleigh log</p>
						<ol>
							{#each SLEIGH_LOG as entry}
								<li>
									<span class="sleigh-log__time">{entry.time}</span>
									<div>
										<strong>{entry.event}</strong>
										<p>{entry.state}</p>
									</div>
								</li>
							{/each}
						</ol>
					</div>
				</section>
			</section>
		{/if}
	</main>

	<footer class="page-footer">
		<ThemeToggle />
	</footer>
</div>

<Modal open={$showModal} title={$editingWishId ? 'Edit wish' : 'Add wish'} onClose={() => showModal.set(false)}>
	<WishForm form={$form} onSave={saveWish} onReset={() => (showModal.set(false), resetForm())} onChange={setForm} saving={$saving} />
</Modal>

<style>
	.page-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		width: 100%;
		position: relative;
		overflow: hidden;
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
		flex-wrap: wrap;
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

		.control-grid {
			padding: 0 1rem;
			grid-template-columns: 1fr;
		}
	}

	.holiday-background {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.holiday-lights {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 140%;
		max-width: 1600px;
		height: 90px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem 0;
		z-index: -1;
	}

	.holiday-lights__bulb {
		width: 18px;
		height: 28px;
		border-radius: 14px;
		background: radial-gradient(circle at 30% 20%, #fff7, var(--col) 70%);
		filter: drop-shadow(0 0 8px var(--col));
		animation: twinkle 4s ease-in-out infinite;
		animation-delay: calc(var(--index) * 0.15s);
		--col: hsl(calc(10 + (var(--index) * 20)), 82%, 60%);
	}

	.holiday-ornaments {
		position: absolute;
		inset: 5% 10% auto;
		display: flex;
		justify-content: space-between;
		font-size: clamp(1.5rem, 2vw, 2.75rem);
		opacity: 0.8;
	}

	.holiday-ornament {
		animation: floaty 6s ease-in-out infinite;
		animation-delay: calc(var(--index) * 0.35s);
	}

	.sky-sparkles {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.sky-sparkle {
		position: absolute;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
		top: calc(var(--index) * 2%);
		left: calc((var(--index) * 37px) % 100%);
		animation: sparkle 5s ease-in-out infinite;
		animation-delay: calc(var(--index) * 0.12s);
	}

	.candy-forest {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		padding-bottom: 1.5rem;
		opacity: 0.2;
	}

	.candy-tree {
		width: 50px;
		height: 120px;
		border-radius: 20px 20px 0 0;
		background: repeating-linear-gradient(135deg, #d7263d 0, #d7263d 12px, #fff 12px, #fff 24px);
		transform: scale(calc(0.6 + (var(--index) * 0.03))) translateY(calc(var(--index) * -3px));
		filter: blur(0.3px);
	}

	.northern-lights {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.northern-lights__beam {
		position: absolute;
		width: 30%;
		height: 320px;
		top: 8%;
		left: calc(var(--index) * 15%);
		background: radial-gradient(circle at 30% 0%, rgba(0, 238, 255, 0.4), transparent 60%);
		filter: blur(12px);
		animation: drift 14s ease-in-out infinite;
		animation-delay: calc(var(--index) * 0.8s);
	}

	.holiday-drift {
		position: absolute;
		bottom: -10%;
		left: -10%;
		right: -10%;
		height: 220px;
		background: radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.8), transparent 65%);
		filter: blur(20px);
		z-index: -1;
	}

	.holiday-chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.holiday-chip {
		background: rgba(215, 38, 61, 0.08);
		border: 1px dashed rgba(215, 38, 61, 0.45);
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.holiday-subtext {
		color: rgba(15, 44, 36, 0.75);
	}

	.holiday-marquee {
		position: relative;
		width: 100%;
		overflow: hidden;
		border: 1px dashed rgba(255, 255, 255, 0.5);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.4);
		padding: 0.3rem 0;
		margin-bottom: 0.4rem;
	}

	.holiday-marquee__track {
		display: inline-flex;
		gap: 2rem;
		min-width: 100%;
		padding-left: 1rem;
		animation: marquee 18s linear infinite;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.holiday-marquee span {
		color: var(--color-primary);
	}

	.holiday-top-info {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.holiday-signal {
		display: inline-flex;
		gap: 0.35rem;
		align-items: center;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.05);
		font-weight: 600;
	}

	.signal-dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: #22c55e;
		box-shadow: 0 0 8px rgba(34, 197, 94, 0.85);
		animation: pulse 1.8s ease-in-out infinite;
	}

	.holiday-countdown {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.35rem 0.75rem;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.55);
		font-size: 0.85rem;
	}

	.holiday-countdown strong {
		font-size: 1.05rem;
	}

	.holiday-progress {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.holiday-progress__bar {
		width: 100%;
		height: 12px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}

	.holiday-progress__bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, #34d399, #d7263d, #f9a8d4);
		box-shadow: 0 0 12px rgba(249, 168, 212, 0.8);
	}

	.control-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0 1.75rem;
	}

	.control-card {
		border: 1px dashed rgba(0, 0, 0, 0.1);
		border-radius: 18px;
		padding: 1rem 1.1rem;
		background: rgba(255, 255, 255, 0.75);
		box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.control-card--hero h3 {
		font-size: 1.35rem;
		margin: 0;
	}

	.control-card ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.control-card li {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-weight: 600;
	}

	.control-card span {
		color: rgba(15, 44, 36, 0.6);
	}

	.control-note {
		font-size: 0.85rem;
		color: rgba(15, 44, 36, 0.7);
		margin: 0;
	}

	.reindeer-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: 0.45rem;
	}

	.reindeer-grid span {
		background: rgba(255, 255, 255, 0.6);
		border-radius: 999px;
		padding: 0.35rem 0.6rem;
		font-size: 0.9rem;
		font-weight: 700;
		text-align: center;
		border: 1px dashed rgba(215, 38, 61, 0.4);
	}

	.playlist li {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.sleigh-log {
		margin-top: 1.5rem;
		background: rgba(255, 255, 255, 0.75);
		border-radius: 20px;
		border: 1px dashed rgba(215, 38, 61, 0.35);
		padding: 1rem 1.5rem;
		box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
	}

	.sleigh-log ol {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.sleigh-log li {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.sleigh-log__time {
		font-family: 'Space Grotesk', monospace;
		font-weight: 700;
		color: var(--color-primary);
		background: rgba(215, 38, 61, 0.1);
		border-radius: 999px;
		padding: 0.2rem 0.5rem;
	}

	.sleigh-log strong {
		display: block;
		font-size: 1rem;
	}

	.sleigh-log p {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(15, 44, 36, 0.7);
	}

	.celebration-panel {
		margin-top: 1.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		padding: 1.2rem 1.35rem;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 20px;
		border: 1px dashed rgba(215, 38, 61, 0.35);
		box-shadow: 0 35px 80px rgba(15, 23, 42, 0.2);
	}

	.celebration-large {
		font-size: 1.25rem;
		font-weight: 700;
		margin-top: 0.2rem;
		color: var(--color-primary);
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.6;
			transform: translateY(0) scale(1);
		}

		50% {
			opacity: 1;
			transform: translateY(-4px) scale(1.1);
		}
	}

	@keyframes floaty {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}

		50% {
			transform: translateY(-10px) rotate(4deg);
		}
	}

	@keyframes sparkle {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.8);
		}

		50% {
			opacity: 1;
			transform: scale(1.4);
		}
	}

	@keyframes drift {
		0%,
		100% {
			transform: translateY(0) scale(1);
			opacity: 0.65;
		}

		50% {
			transform: translateY(-20px) scale(1.1);
			opacity: 0.95;
		}
	}

	@keyframes marquee {
		0% {
			transform: translateX(0);
		}

		100% {
			transform: translateX(-100%);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}

		50% {
			transform: scale(1.4);
		}
	}
</style>
