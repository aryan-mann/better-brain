<script lang="ts">
    import { onMount } from "svelte";
    import { getAllTopics, saveTopics, type TopicMap, type TopicT } from "../utils";
    let topics: TopicMap = {};

    let newTopicName: string = "";
    let processing: boolean = false;

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

            currentTopics[newTopicName] = { name: newTopicName };
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
        await chrome.storage.sync.set({
            "better-brain-topics": {}
        })
        topics = await getAllTopics();
    }

</script>

<div>
    <p class="text-xl px-2 pt-2 bg-purple-800 text-white">Topic Manager</p>
    <div>
        {#if typeof topics !== "object" || Object.keys(topics).length === 0}
            <p>No topics added yet.</p>
        {/if}
        <div class="flex flex-wrap w-full gap-1 px-2 py-4">
            {#each Object.values(topics) as topicInfo (topicInfo.name)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                    on:click={() => { onTopicSelected(topicInfo) }}
                    class="bg-purple-500 text-sm text-white px-2 rounded select-none shadow py-1 cursor-pointer"
                >{topicInfo.name}</div>    
            {/each}
        </div>
    <div>
        <label for="new-topic">New Topic</label>
        <input id="new-topic" bind:value={newTopicName} type="text" />
        <button disabled={processing} on:click={addNewTopic}>Add</button>
        <button disabled={processing} on:click={deleteAllTopics}>Delete All</button>
    </div>
    </div>
</div>