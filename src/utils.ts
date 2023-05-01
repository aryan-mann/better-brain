export type TopicT = {
    name: string
    parent?: TopicT
}

export type TabT = {
    topic: TopicT,
    url: string,
    title: string,
    tags: string
}

export const TAB_DATA_SYNC_KEY: string = "better-brain-tabs";
export const TOPIC_DATA_SYNC_KEY: string = "better-brain-topics";

export type ObjectMap<T> = { [key: string]: T }
export type TopicMap = ObjectMap<TopicT>
export type SavedTabMap = ObjectMap<TabT>
export type OpenTabMap = ObjectMap<{ tab: chrome.tabs.Tab, selected?: boolean }>;

export const getAllTopics = async (): Promise<TopicMap> => {
    let topics: TopicMap = {};
    const data: unknown = await chrome.storage.sync.get(TOPIC_DATA_SYNC_KEY);

    if (typeof data === "object" && TOPIC_DATA_SYNC_KEY in data) {
        topics = data[TOPIC_DATA_SYNC_KEY];
    }

    return topics;
}

export const saveTopics = async (topics: TopicMap): Promise<boolean> => {
    try {
        await chrome.storage.sync.set({ [TOPIC_DATA_SYNC_KEY]: topics })
    } catch {
        return false;
    }
    return true;
}

export const getAllOpenTabs = async (): Promise<OpenTabMap> => {
    return new Promise((res, rej) => {
        try {
            chrome.tabs.query({ }, (tabResult) => {
                const otm: OpenTabMap = {};
                tabResult.forEach((t) => { if (t.url) { otm[t.url] = { tab: t }; } })
                res(otm)
            })
        } catch (exc) {
            if (exc instanceof Error) {
                rej(`${exc.name}: ${exc.message}`)
            } else {
                rej(exc)
            }
        }
    })
}

export const getAllSavedTabs = async (): Promise<SavedTabMap> => {
    let tabs: SavedTabMap = {};

    const data: unknown = await chrome.storage.sync.get(TAB_DATA_SYNC_KEY)
    if (typeof data == "object" && TAB_DATA_SYNC_KEY in data) {
        // TODO: Don't trust the type returned by data[TAB_DATA_SYNC_KEY]
        tabs = data[TAB_DATA_SYNC_KEY];
    }

    return tabs;
}

export const saveAllTabs = async (tabs: SavedTabMap): Promise<boolean> => {
    try {
        await chrome.storage.sync.set({ [TAB_DATA_SYNC_KEY]: tabs })
    } catch {
        return false;
    }
    return true;
}