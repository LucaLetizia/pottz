<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
	<div class="mx-auto max-w-6xl p-4 md:p-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{@render children()}
		</div>
	</div>
</div>
