<script lang="ts">
    import { onMount } from "svelte";
    import { getAllSavedTabs, getAllTopics, getUUIDv4, saveTopics, SpecialTopics, type TopicMap, type TopicT } from "../utils";
    let topics: TopicMap = {};

    let newTopicName: string = "";
    let processing: boolean = false;
    let showOptions: boolean = true;

    export let onTopicSelected = (topic: TopicT) => {};

    async function addNewTopic() {
        if (processing)
            return

        if (newTopicName === null || newTopicName === undefined || newTopicName.length === 0) {
            alert(`You tried creating a topic without a name!`)
            return
        }

        try {
            const currentTopics = await getAllTopics();
            if (newTopicName in currentTopics) {
                alert(`A topic with the name '${newTopicName}' already exists.`)
                return
            }

            currentTopics[newTopicName] = { name: newTopicName, uuid: getUUIDv4() };
            await saveTopics(currentTopics);
            alert(`Topic '${newTopicName}' added!`)
        } catch (err) {
            alert(`Could not add topic: ${err}`)
        } finally {
            topics = await getAllTopics();
        }
    }

    onMount(async () => {
        topics = await getAllTopics();
    })

    async function deleteAllTopics() {
        if (confirm("This will delete all topics and set all posts to have the default #Unassorted topic.")) {
            await saveTopics({})
            topics = await getAllTopics();

            const allSavedPosts = await getAllSavedTabs();
            const allSavedPostKeys = Object.keys(allSavedPosts);
            for (let i=0; i < allSavedPostKeys.length; i++) {
                allSavedPosts[allSavedPostKeys[i]].topic = SpecialTopics.Unassorted
            }
        }
    }

</script>

<div class="flex-col">
    <!-- Header -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <p class="text-xl px-2 py-2 bg-slate-600 text-white cursor-pointer" on:click={() => { showOptions = !showOptions; }}>Topic Manager</p>
    {#if showOptions}
    <div class="flex-col px-2">
        <!-- Topic List -->
        <div class="flex flex-wrap w-full gap-1 px-2 pt-2 py-4">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div on:click={() => { onTopicSelected(SpecialTopics.Unassorted) }} class="topic">Unassorted</div>
            {#each Object.values(topics) as topicInfo (topicInfo.name)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div on:click={() => { onTopicSelected(topicInfo) }} class="topic">{topicInfo.name}</div>    
            {/each}
        </div>
        <!-- Add New Topic -->
        <div class="flex items-center px-2 w-full gap-2">
            <label for="new-topic">New Topic</label>
            <input class="grow bg-slate-200 px-2 py-1 shadow" id="new-topic" bind:value={newTopicName} type="text" />
            <button class="px-2 py-1 bg-green-800 rounded text-white" disabled={processing} on:click={addNewTopic}>Add</button>
        </div>
        <!-- Additional Options -->
        <div class="flex items-center pt-2 pb-4 flex-row-reverse w-full">
            <button class="bg-red-800 text-white px-2 py-1 rounded" disabled={processing} on:click={deleteAllTopics}>Delete All</button>
        </div>  
    </div>
    {/if}
</div>

<style>
    .topic {
        @apply bg-purple-500 text-sm text-white px-2 rounded select-none shadow py-1 cursor-pointer;
    }
</style>