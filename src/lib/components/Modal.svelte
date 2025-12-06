<script lang="ts">
	let { open, title, onClose, children } = $props<{ open: boolean; title: string; onClose: () => void; children?: any }>();
</script>

{#if open}
	<div class="backdrop" role="presentation" tabindex="-1" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()}>
		<div class="modal" role="dialog" aria-modal="true" aria-label={title} tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && onClose()}>
			<div class="modal-header">
				<h3>{title}</h3>
				<button class="icon" onclick={onClose} aria-label="Close">×</button>
			</div>
			<div class="modal-body">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.45);
		backdrop-filter: blur(4px);
		display: grid;
		place-items: center;
		z-index: 50;
		padding: 1rem;
	}

	.modal {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem 1.25rem;
		width: min(520px, 100%);
		box-shadow: var(--shadow-strong);
		border: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.modal-header h3 {
		margin: 0;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	button.icon {
		border: none;
		background: var(--color-surface-alt);
		border-radius: 50%;
		width: 32px;
		height: 32px;
		cursor: pointer;
		font-size: 1rem;
		display: grid;
		place-items: center;
		color: var(--color-text);
		transition: background var(--transition);
	}

	button.icon:hover {
		background: var(--color-border);
	}
</style>
