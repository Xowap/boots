<script lang="ts">
    import favicon from "$lib/assets/favicon.svg";
    import "../app.scss";
    import "$lib/styles/bits-ui.scss";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
