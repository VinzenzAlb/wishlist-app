<script lang="ts">
	import { onMount } from 'svelte';

	const BASE_SNOWFLAKE_COUNT = 70;
	const BASE_VIEWPORT_AREA = 1440 * 900;
	const MIN_SNOWFLAKE_COUNT = 40;
	const MAX_SNOWFLAKE_COUNT = 220;

	type Snowflake = {
		left: number;
		delay: number;
		duration: number;
		size: number;
		sway: number;
	};

	const createSnowflakes = (count: number): Snowflake[] =>
		Array.from({ length: count }, () => ({
			left: Math.random() * 100,
			delay: -Math.random() * 24,
			duration: 14 + Math.random() * 16,
			size: 0.5 + Math.random() * 1.2,
			sway: 20 + Math.random() * 40
		}));

	const getSnowflakeCount = () => {
		if (typeof window === 'undefined') {
			return BASE_SNOWFLAKE_COUNT;
		}

		const area = window.innerWidth * window.innerHeight;
		const densityCount = Math.round((area / BASE_VIEWPORT_AREA) * BASE_SNOWFLAKE_COUNT);

		return Math.max(MIN_SNOWFLAKE_COUNT, Math.min(MAX_SNOWFLAKE_COUNT, densityCount));
	};

	let snowflakes: Snowflake[] = createSnowflakes(BASE_SNOWFLAKE_COUNT);

	const updateSnowfall = () => {
		const count = getSnowflakeCount();
		snowflakes = createSnowflakes(count);
	};

	onMount(() => {
		updateSnowfall();
		window.addEventListener('resize', updateSnowfall);
		return () => window.removeEventListener('resize', updateSnowfall);
	});
</script>

<div class="snowfield" aria-hidden="true">
	{#each snowflakes as flake, index (index)}
		<span
			class="snowflake"
			style={`--flake-left: ${flake.left}%; --flake-delay: ${flake.delay}s; --flake-duration: ${flake.duration}s; --flake-size: ${flake.size}; --flake-sway: ${flake.sway}px;`}
		></span>
	{/each}
</div>

<style>
	.snowfield {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		overflow: hidden;
		opacity: 0;
		transition: opacity 200ms ease-out;
	}

	.snowflake {
		position: absolute;
		top: -10vh;
		left: var(--flake-left, 50%);
		width: calc(4px * var(--flake-size, 1));
		height: calc(4px * var(--flake-size, 1));
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.94);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.85);
		opacity: 0.95;
		animation:
			fall var(--flake-duration, 20s) linear infinite,
			sway calc(var(--flake-duration, 20s) * 0.6) ease-in-out infinite;
		animation-delay: var(--flake-delay, 0s);
	}

	@keyframes fall {
		0% {
			top: -10vh;
		}
		100% {
			top: 110vh;
		}
	}

	@keyframes sway {
		0% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(var(--flake-sway, 30px));
		}
		100% {
			transform: translateX(0);
		}
	}

	:global(body.theme-christmas) .snowfield {
		opacity: 1;
	}
</style>
