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
	<label class="form-field">
		<span>Title *</span>
		<input class="input" placeholder="Trip to Japan" value={form.title} oninput={(e) => updateField('title', (e.target as HTMLInputElement).value)} />
	</label>
	<label class="form-field">
		<span>Link</span>
		<input class="input" placeholder="https://example.com" value={form.link ?? ''} oninput={(e) => updateField('link', (e.target as HTMLInputElement).value)} />
	</label>
	<label class="form-field">
		<span>Priority</span>
		<select class="input" value={form.priority} onchange={(e) => updateField('priority', Number((e.target as HTMLSelectElement).value))}>
			<option value={1}>★</option>
			<option value={2}>★★</option>
			<option value={3}>★★★</option>
		</select>
	</label>
	<div class="form-actions">
		<button class="btn btn--primary" onclick={onSave} disabled={saving}>
			{saving ? 'Saving…' : 'Save wish'}
		</button>
		<button class="btn btn--ghost" onclick={onReset}>Cancel</button>
	</div>
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.5rem 0;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}
</style>
