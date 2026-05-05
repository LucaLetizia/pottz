<script lang="ts">
	import type { PageProps } from './$types';
	import { getReleaseNotes } from './data.remote';

	let { data, form }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let incidentSummary = $state(form?.incidentSummary || '');
	// svelte-ignore state_referenced_locally
	let incidentCausedBy = $state(form?.incidentCausedBy || '');
	let releaseNotes = $state(await getReleaseNotes());

	let apiResult: Record<string, string> | null = $state(null);

	async function callApi() {
		const res = await fetch('/api/my-secret');
		apiResult = await res.json();
	}
</script>

<!-- Server Load Function -->
<div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<p class="text-xs font-medium tracking-widest text-indigo-400 uppercase">SvelteKit Feature</p>
			<h2 class="text-lg font-semibold text-white">+page.server.ts Load Function</h2>
		</div>

		<span
			class="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300"
		>
			System Status
		</span>
	</div>

	<div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
		<p class="text-sm text-slate-400">Server status</p>
		<p class="mt-1 text-base font-medium text-white">
			{data?.serverStatus}™
		</p>
	</div>
</div>

<!-- Form Actions -->
<div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<p class="text-xs font-medium tracking-widest text-indigo-400 uppercase">SvelteKit Feature</p>
			<h2 class="text-lg font-semibold text-white">Form Actions</h2>
		</div>

		<span
			class="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300"
		>
			Incident Report
		</span>
	</div>

	<form method="POST" class="space-y-3">
		<div>
			<label class="mb-1 block text-xs text-slate-400" for="incident-summary">What broke?</label>
			<input
				name="incident-summary"
				bind:value={incidentSummary}
				placeholder="Production is on fire"
				class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white transition outline-none focus:border-indigo-400"
			/>
		</div>

		<div>
			<label class="mb-1 block text-xs text-slate-400" for="incident-caused-by"
				>Who caused it?</label
			>
			<input
				name="incident-caused-by"
				bind:value={incidentCausedBy}
				placeholder="Definitely not me"
				class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white transition outline-none focus:border-indigo-400"
			/>
		</div>

		<button
			class="mt-2 w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
		>
			Submit Incident
		</button>
	</form>

	{#if form?.success}
		<div
			class="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
		>
			Incident report submitted successfully. Blame has been assigned automatically.
		</div>
	{/if}
</div>

<!-- API Route + Server-only Modules + Env variables -->
<div
	class="flex flex-col rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm"
>
	<!-- Header -->
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<p class="text-xs font-medium tracking-widest text-indigo-400 uppercase">SvelteKit Feature</p>
			<h2 class="text-lg font-semibold text-white">
				+server.ts + Server-only Modules + Env Variables
			</h2>
		</div>

		<span
			class="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300"
		>
			Internal Secrets API
		</span>
	</div>

	<!-- Expandable content area -->
	<div class="flex-1">
		<div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
			<p class="text-sm text-slate-400">Runtime Verification</p>

			{#if apiResult}
				<div class="mt-3 space-y-4 text-sm">
					<div>
						<p class="text-xs tracking-wide text-slate-500 uppercase">Emergency Protocol</p>
						<p class="mt-1 leading-relaxed text-white">
							{apiResult.secret}
						</p>
					</div>

					<div>
						<p class="text-xs tracking-wide text-slate-500 uppercase">Environment</p>
						<p class="mt-1 text-white">
							{apiResult.env}
						</p>
					</div>

					<div>
						<p class="text-xs tracking-wide text-slate-500 uppercase">App Name</p>
						<p class="mt-1 text-white">
							{apiResult.appName}
						</p>
					</div>

					<div>
						<p class="text-xs tracking-wide text-slate-500 uppercase">Private Token Alias</p>
						<p class="mt-1 text-white">
							{apiResult.tokenAlias}
						</p>
					</div>
				</div>
			{:else}
				<p class="mt-2 text-sm text-slate-500">
					Retrieve internal runtime configuration from the server-only module.
				</p>
			{/if}
		</div>
	</div>

	<button
		onclick={callApi}
		class="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
	>
		Retrieve Secret
	</button>
</div>

<!-- Remote Functions -->
<div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg backdrop-blur-sm">
	<div class="mb-4 flex items-start justify-between gap-4">
		<div>
			<p class="text-xs font-medium tracking-widest text-indigo-400 uppercase">SvelteKit Feature</p>
			<h2 class="text-lg font-semibold text-white">Remote Functions</h2>
		</div>

		<span
			class="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300"
		>
			Release Notes Generator
		</span>
	</div>

	<div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
		<p class="text-sm text-slate-400">Latest deployment</p>

		<p class="mt-1 text-base font-medium text-white">
			Version {releaseNotes.version}
		</p>

		<div class="mt-4">
			<p class="mb-2 text-sm text-slate-400">Release notes</p>

			<ul class="space-y-2 text-sm text-slate-300">
				{#each releaseNotes.notes.split('|') as note (note)}
					<li class="rounded-lg bg-slate-800/60 px-3 py-2">
						• {note}
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
