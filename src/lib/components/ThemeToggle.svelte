<script lang="ts">
	import { onMount } from 'svelte';

	const THEME_STORAGE_KEY = 'wishlist-theme';
	const THEMES = ['christmas', 'light', 'dark'] as const;
	type Theme = (typeof THEMES)[number];

	const themeOptions: { id: Theme; name: string; description: string }[] = [
		{
			id: 'christmas',
			name: 'Weihnachten',
			description: 'Standard. Tiefe Grün- und Goldtöne.'
		},
		{ id: 'light', name: 'Hell', description: 'Klar mit sanften Blautönen.' },
		{ id: 'dark', name: 'Dunkel', description: 'Dunkel mit Neon-Akzenten.' }
	];

	let theme: Theme = 'christmas';
	let hydrated = false;

	onMount(() => {
		const stored =
			typeof localStorage === 'undefined' ? null : localStorage.getItem(THEME_STORAGE_KEY);
		if (isTheme(stored)) {
			theme = stored;
		} else {
			theme = 'christmas';
		}
		persistTheme(theme);
		applyTheme(theme);
		hydrated = true;
	});

	$: if (hydrated) {
		applyTheme(theme);
		persistTheme(theme);
	}

	function isTheme(value: string | null): value is Theme {
		return Boolean(value && THEMES.includes(value as Theme));
	}

	function applyTheme(next: Theme) {
		if (typeof document === 'undefined') return;
		document.body.classList.remove(...THEMES.map((t) => `theme-${t}`));
		document.body.classList.add(`theme-${next}`);
	}

	function persistTheme(next: Theme) {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(THEME_STORAGE_KEY, next);
	}

	function selectTheme(next: Theme) {
		theme = next;
	}
</script>

<div class="theme-toggle">
	<div class="theme-toggle__bar">
		<div>
			<p class="muted text-sm">Gestalte es nach deinem Geschmack</p>
			<p class="theme-toggle__title">
				{theme === 'christmas'
					? 'Festliche Magie'
					: theme === 'dark'
						? 'Mitternachtsmodus'
						: 'Heller Modus'}
			</p>
			<p class="muted text-sm">
				{theme === 'christmas'
					? 'Standarderlebnis mit festlichem Glanz.'
					: theme === 'dark'
						? 'Dunkles High-Contrast-Design mit Neon-Akzenten.'
						: 'Helle, luftige Palette mit sanften Blautönen.'}
			</p>
		</div>
		<div class="theme-toggle__options">
			{#each themeOptions as option}
				<button
					type="button"
					class="theme-chip"
					class:active={theme === option.id}
					onclick={() => selectTheme(option.id)}
					aria-pressed={theme === option.id}
				>
					<span class={`swatch swatch--${option.id}`} aria-hidden="true"></span>
					<span class="theme-chip__text">
						<span class="theme-chip__name">{option.name}</span>
						<span class="theme-chip__desc">{option.description}</span>
					</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.theme-toggle {
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
	}

	.theme-toggle__bar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 14px;
		padding: 1rem 1.2rem;
		box-shadow: var(--shadow-soft);
	}

	.theme-toggle__title {
		font-weight: 700;
		margin: 0.1rem 0 0.25rem;
	}

	.theme-toggle__options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.6rem;
	}

	.theme-chip {
		border: 1px solid var(--color-border);
		background: var(--color-surface-alt);
		border-radius: 12px;
		padding: 0.75rem 0.85rem;
		display: flex;
		gap: 0.6rem;
		align-items: center;
		cursor: pointer;
		transition:
			transform 120ms ease,
			box-shadow 160ms ease,
			border-color var(--transition),
			background var(--transition);
		color: inherit;
		text-align: left;
	}

	.theme-chip:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
	}

	.theme-chip.active {
		border-color: var(--color-primary);
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
		background: linear-gradient(135deg, var(--color-surface), var(--color-surface-alt));
	}

	.theme-chip__text {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		font-size: 0.95rem;
	}

	.theme-chip__name {
		font-weight: 700;
	}

	.theme-chip__desc {
		color: var(--color-muted);
		font-size: 0.9rem;
	}

	.swatch {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		border: 1px solid var(--color-border);
		display: inline-block;
		flex-shrink: 0;
	}

	.swatch--christmas {
		background: linear-gradient(135deg, #0f8a5c, #2fb679 50%, #f1c27d);
	}

	.swatch--light {
		background: linear-gradient(135deg, #e0f2fe, #f8fafc);
	}

	.swatch--dark {
		background: radial-gradient(circle at 25% 25%, #22d3ee, #0f172a 55%);
	}

	@media (max-width: 640px) {
		.theme-toggle__bar {
			align-items: stretch;
		}
	}
</style>
