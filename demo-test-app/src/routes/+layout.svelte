<script lang="ts">
	import { resolve } from '$app/paths';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>DocuMind Svelte Demo</title>
</svelte:head>

<div class="shell">
	<header class="topbar">
		<div>
			<p class="eyebrow">DocuMind Seeded Build</p>
			<h1>Svelte Workspace</h1>
		</div>
		<nav>
			<a href={resolve('/')}>Home</a>
			<a href={resolve('/analytics')}>Analytics</a>
			<a href={resolve('/reference')}>Reference</a>
		</nav>
	</header>
	<main>{@render children()}</main>
</div>
