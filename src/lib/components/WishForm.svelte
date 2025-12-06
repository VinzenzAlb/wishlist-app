<script lang="ts">
	import type { Wish } from '$lib/types';

	let {
		canEdit,
		form,
		editingWishId,
		onSave,
		onReset,
		onChange
	} = $props<{
		canEdit: boolean;
		form: { title: string; link: string | null; priority: number };
		editingWishId: string | null;
		onSave: () => void;
		onReset: () => void;
		onChange: (form: { title: string; link: string | null; priority: number }) => void;
	}>();

	function updateField(key: keyof typeof form, value: string | number) {
		onChange({ ...form, [key]: value });
	}
</script>

<div class="card">
	<div class="card-header">
		<h3>{editingWishId ? 'Edit wish' : 'Add a wish'}</h3>
		{#if !canEdit}
			<span class="muted small">Switch to this user to edit.</span>
		{/if}
	</div>
	<div class="form">
		<label>
			<span>Title *</span>
			<input placeholder="Trip to Japan" value={form.title} oninput={(e) => updateField('title', (e.target as HTMLInputElement).value)} />
		</label>
		<label>
			<span>Link</span>
			<input placeholder="https://example.com" value={form.link ?? ''} oninput={(e) => updateField('link', (e.target as HTMLInputElement).value)} />
		</label>
		<label>
			<span>Priority</span>
			<select value={form.priority} onchange={(e) => updateField('priority', Number((e.target as HTMLSelectElement).value))}>
				<option value={1}>★</option>
				<option value={2}>★★</option>
				<option value={3}>★★★</option>
			</select>
		</label>
		<div class="form-actions">
			<button class="primary" onclick={onSave} disabled={!canEdit}>
				{editingWishId ? 'Update wish' : 'Add wish'}
			</button>
			{#if editingWishId}
				<button class="link" onclick={onReset}>Cancel</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.muted {
		color: #475569;
	}

	.small {
		font-size: 0.9rem;
	}

	.card {
		background: #fff;
		border-radius: 14px;
		padding: 1.25rem;
		box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-weight: 600;
		color: #0f172a;
	}

	input,
	select {
		padding: 0.65rem 0.8rem;
		border-radius: 10px;
		border: 1px solid #cbd5e1;
		font-size: 1rem;
		outline: none;
		background: #fff;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	input:focus,
	select:focus {
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	button {
		border: none;
		border-radius: 10px;
		padding: 0.65rem 0.95rem;
		font-weight: 600;
		cursor: pointer;
		background: #e2e8f0;
		color: #0f172a;
		transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.2s ease;
	}

	button:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.primary {
		background: linear-gradient(135deg, #2563eb, #4f46e5);
		color: white;
	}

	.link {
		background: transparent;
		color: #2563eb;
		padding-left: 0;
	}
</style>
