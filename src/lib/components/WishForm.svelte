<script lang="ts">
	let { form, onSave, onReset, onChange, saving } = $props<{
		form: { title: string; link: string | null; priority: number };
		onSave: () => void;
		onReset: () => void;
		onChange: (form: { title: string; link: string | null; priority: number }) => void;
		saving?: boolean;
	}>();

	function updateField(key: keyof typeof form, value: string | number) {
		onChange({ ...form, [key]: value });
	}
</script>

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
		<button class="primary" onclick={onSave} disabled={saving}>
			{saving ? 'Saving…' : 'Save wish'}
		</button>
		<button class="link" onclick={onReset}>Cancel</button>
	</div>
</div>

<style>
	/* container provided by parent */
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.5rem 0;
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
