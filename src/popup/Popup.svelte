<script lang="ts">
    import { onMount } from "svelte";
    import TopicManager from "../components/TopicManager.svelte";
    import { getAllOpenTabs, getAllSavedTabs, saveAllTabs, type OpenTabMap, type TabT, type TopicT, type SavedTabMap, SpecialTopics, type OpenTabT, saveTopics } from "../utils";

    let openTabs: OpenTabMap = {};
    let savedTabs: SavedTabMap = {};
    let openTabStatus: { [uuid: string]: boolean } = {};

    let shiftHeld: boolean = false;
    let altHeld: boolean = false;
    let userSearch: string = "";

    onMount(async () => {
        /* Events for checking if shift is pressed */
        window.onkeydown = (e: KeyboardEvent) => { if (e.key === "Shift") { shiftHeld = true; } else if (e.key === "Alt") { altHeld = true; }  };
        window.onkeyup = (e: KeyboardEvent) => { if (e.key === "Shift") { shiftHeld = false; } else if (e.key === "Alt") { altHeld = false; } };

        await refreshAll();
    })

    async function refreshAll(): Promise<void> {
        savedTabs = await getAllSavedTabs();
        openTabs = await getAllOpenTabs();
    }
    
    // TODO: Remove this
    let msg = "";
    async function topicSelected(topic: TopicT): Promise<void> {
        // TODO: If no tabs are selected, filter by tabs
        if (Object.keys(openTabStatus).length === 0) {
            const allSavedTabs = { ...(await getAllSavedTabs()) };
            // Get all saved tabs with the particular topic
            const tabsToOpen: Array<TabT> = Object.values(allSavedTabs).filter((t) => t.topic.uuid === topic.uuid);

            const currentlyOpenTabs = await getAllOpenTabs();
            // Add all unsaved tabs to saved tabs with the Unassorted topic
            Object.values(currentlyOpenTabs).forEach((ot) => {
                // If we have saved the tab before
                if (ot.uuid in savedTabs) {
                } else {
                    savedTabs[ot.uuid] = {
                        title: ot.tab.title,
                        url: ot.tab.url,
                        uuid: ot.uuid,
                        topic: SpecialTopics.Unassorted,
                    }
                }
            })

            await saveAllTabs(allSavedTabs);
            
            // Delete all open tabs
            const removePromises: Array<Promise<void>> = [];
            Object.values(currentlyOpenTabs).forEach((ot, i) => {
                if (i === 0) {
                    return;
                }
                const tabUrl = ot.tab.url;
                removePromises.push(new Promise<void>((res, rej) => {
                    try {
                        chrome.tabs.remove(ot.tab.id, (x) => { res() })
                    } catch { rej(`Unable to discard: ${tabUrl}`) }
                }))
            })
            await Promise.allSettled(removePromises);

            // Create tabs of selected topic
            const createPromises: Array<Promise<void>> = [];
            const createdTabs: Array<chrome.tabs.Tab> = [];
            tabsToOpen.forEach((t) => {
                createPromises.push(new Promise<void>((res, rej) => {
                    try {
                    chrome.tabs.create({ url: t.url }, (ct) => { createdTabs.push(ct); res() })
                    } catch { rej(`Unable to create: ${t.url}`) }
                }))
            })

            await Promise.allSettled(createPromises);

            await new Promise<void>((res, rej) => {
                try {
                    chrome.tabs.group({ tabIds: createdTabs.map((t) => t.id) }, cb => { res() })
                } catch (err) {
                    msg = `ERROR: ${err}`
                    rej(err)
                }
            })

            openTabStatus = {}
            await refreshAll()
            return
        } else {
            let allSavedTabs = { ...await getAllSavedTabs() };
            orderedOpenTabs.forEach((ot) => {
                if (ot.uuid in openTabStatus && openTabStatus[ot.uuid] === true) {
                    const updatedTab: TabT = {
                        uuid: ot.uuid,
                        title: ot.tab.title,
                        url: ot.tab.url,
                        topic: topic,
                    }
                    allSavedTabs[updatedTab.url] = updatedTab;
                }
            })

            await saveAllTabs(allSavedTabs);
            openTabStatus = {};
            await refreshAll();
        }
    }

    let orderedOpenTabs: Array<OpenTabT> = [];
    let orderedSavedTabs: Array<TabT> = [];
    
    $: {
        orderedOpenTabs = Object.values(openTabs);
    }
    $: orderedSavedTabs = Object.values(savedTabs);

    async function selectTab(openTabUuid: string) {
        const originalTabStatus = (openTabUuid in openTabStatus && openTabStatus[openTabUuid]) || false;
            
        if (altHeld) {
            openTabStatus[openTabUuid] = !originalTabStatus;
            return    
        }
        
        if (!shiftHeld) {
            const originalTabStatus = (openTabUuid in openTabStatus && openTabStatus[openTabUuid]) || false;
            openTabStatus = {};
            openTabStatus[openTabUuid] = !originalTabStatus;
            return
        }
    }
</script>

<div class="w-96 h-64">
    {msg}
    <TopicManager onTopicSelected={topicSelected} />
    <h2 class="text-lg bg-blue-100 text-center py-1">Open Tabs</h2>
    <div class="flex flex-col w-full">
    {#each orderedOpenTabs as t, i (t.uuid)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="tab-item" data-selected={(t.uuid in openTabStatus && openTabStatus[t.uuid] === true)} on:click={() => selectTab(t.uuid)}>
            <div class="flex w-full gap-2 items-center select-none">
                {#if t.tab.favIconUrl}
                <img class="h-4 w-4" alt="" src={t.tab.favIconUrl} />
                {:else}
                <span class="h-4 w-4 text-center">❄</span>
                {/if}
                <p class="whitespace-nowrap select-none">{t.tab.title}</p>
            </div>
            <div class="flex w-full items-center mt-1">
                {#if t.tab.url in savedTabs}
                {@const savedTabData = savedTabs[t.tab.url]}
                {#if savedTabData.topic}
                <div class="topic">#{savedTabData.topic.name}</div>
                {/if}
                {/if}
            </div>
        </div>
    {/each}
    </div>
    <h2 class="text-lg bg-yellow-100 text-center py-1">Saved Tabs</h2>
    <div class="flex flex-col w-full">
    <div class="flex items-center px-2">
        <label for="user-search">Search</label>
        <input class="grow bg-slate-200 px-2 py-1 shadow" id="user-search" type="text" bind:value={userSearch} />
    </div>
    {#each orderedSavedTabs as savedTab, i}
        <!-- TODO: Better search -->
        {#if userSearch.length === 0 || savedTab.title.toLowerCase().startsWith(userSearch.toLowerCase())}
        <div class="flex flex-col whitespace-nowrap select-none">
            <div class="flex flex-col w-full px-2 py-1">
                <div class="flex w-full">
                    <div>{savedTab.title}</div>
                </div>
                <div class="flex w-full mt-1 gap-2">
                    <div class="topic">#{savedTab.topic.name}</div>
                    <button class="px-2 py-1 bg-green-800 text-white" on:click={(e) => { chrome.tabs.create({ url: savedTab.url }) }}>Open</button>
                    <button class="px-2 py-1 bg-red-800 text-white" on:click={async (e) => { delete savedTabs[savedTab.uuid]; await saveAllTabs(savedTabs); await refreshAll(); }}>Delete</button>
                </div>
            </div>
        </div>
        {/if}
    {/each}
    <div class="flex w-full px-4 py-2 flex-row-reverse">
        {#if Object.keys(savedTabs).length > 0}
        <button class="px-2 py-1 bg-blue-100 rounded shadow" on:click={async () => { await saveAllTabs({}); await refreshAll(); }}>Clear</button>
        {/if}
    </div>
    </div>
</div>

<style>
    .topic {
        @apply px-1 bg-slate-700 text-white rounded;
    }
    .tab-item {
        @apply w-full px-2 py-2 bg-slate-50 cursor-pointer flex-col;
    }
    .tab-item:hover {
        @apply bg-yellow-300;
    }
    .tab-item[data-selected=true] {
        @apply bg-orange-400;
    }
</style>