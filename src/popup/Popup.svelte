<script lang="ts">
    import { onMount } from "svelte";
    import TopicManager from "../components/TopicManager.svelte";
    import { getAllOpenTabs, getAllSavedTabs, saveAllTabs, type OpenTabMap, type TabT, type TopicT, type SavedTabMap } from "../utils";

    let openTabs: OpenTabMap = {};
    let savedTabs: SavedTabMap = {};

    let shiftHeld: boolean = false;
    onMount(async () => {
        /* Events for checking if shift is pressed */
        window.onkeydown = (e: KeyboardEvent) => { if (e.key === "Shift") { shiftHeld = true; } };
        window.onkeyup = (e: KeyboardEvent) => { if (e.key === "Shift") { shiftHeld = false; } };

        await refreshAll();
    })

    async function refreshAll(): Promise<void> {
        savedTabs = await getAllSavedTabs();
        openTabs = await getAllOpenTabs();
    }

    let lastSelectedTabUrl: number | null = null;
    async function selectTab(tabUrl: string) {
        openTabs[tabUrl].selected = true;
        // const selectedTab = openTabs[tabUrl];
        // if (!shiftHeld || lastSelectedTabUrl === null || lastSelectedTabUrl == tabUrl) {
        //     const tabSelectedState = selectedTab.selected;
            
            
        //     openTabs.forEach((t) => t.selected = false);
            
        //     openTabs[tabUrl].selected = !tabSelectedState;

        //     if (openTabs[tabUrl].selected) {
        //         lastSelectedTabUrl = tabUrl;
        //     } else {
        //         lastSelectedTabUrl = null;
        //     }
        //     return
        // }
        // // Invariant: User is pressing Shift, there is a lastSelectedTabIndex that is not tabIndex
        // const lsi = Math.min(tabUrl, lastSelectedTabUrl);
        // const hsi = Math.max(tabUrl, lastSelectedTabUrl);

        // for (let i=0; i < openTabs.length; i++) {
        //     if (i >= lsi && i <= hsi) {
        //         openTabs[i].selected = true;
        //     }
        // }
    }
    
    let msg = "xx";
    async function topicSelected(topic: TopicT): Promise<void> {
        let allSavedTabs = { ...await getAllSavedTabs() };
        Object.values(openTabs).forEach((ot) => {
            if (ot.selected) {
                const updatedTab: TabT = {
                    title: ot.tab.title,
                    url: ot.tab.url,
                    topic: topic,
                    tags: ""
                }
                allSavedTabs[updatedTab.url] = updatedTab;
            }
        })

        await saveAllTabs(allSavedTabs);
        await refreshAll();
    }
</script>

<div class="w-96 h-64">
    {msg}
    <TopicManager onTopicSelected={topicSelected} />
    <h2>Open Tabs</h2>
    <div class="flex flex-col w-full">
    {#each Object.values(openTabs) as tabInfo, i}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="tab-item" data-selected={tabInfo.selected} on:click={() => selectTab(tabInfo.tab.url)}>
            <p class="whitespace-nowrap select-none">{tabInfo.tab.title}</p>
            <div class="w-full items-center">
                {#if tabInfo.tab.url in savedTabs}
                {@const savedTabData = savedTabs[tabInfo.tab.url]}
                <div>#{savedTabData.topic.name}</div>
                {/if}
            </div>
        </div>
    {/each}
    </div>
    <h2>Saved Tabs</h2>
    <div class="flex flex-col w-full">
    {#each Object.values(savedTabs) as savedTab}
        <div class="flex flex-col whitespace-nowrap select-none">
            <div>{savedTab.title}</div>
            <div>{savedTab.topic.name}</div>
        </div>
    {/each}
    </div>
</div>

<style>
    .tab-item {
        @apply w-full px-2 py-2 bg-slate-50 cursor-pointer;
    }
    .tab-item:hover {
        @apply bg-yellow-300;
    }
    .tab-item[data-selected=true] {
        @apply bg-orange-400;
    }
</style>