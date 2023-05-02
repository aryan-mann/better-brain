export type TopicT = {
    uuid: string,
    name: string;
    parent?: TopicT;
}

export type TabT = {
    uuid: string;
    topic?: TopicT;
    url: string;
    faviconUrl?: string;
    title: string;
    tags?: string;
}

export type OpenTabT = {
    tab: chrome.tabs.Tab;
    uuid: string;
}

export const TAB_DATA_SYNC_KEY: string = "better-brain-tabs";
export const TOPIC_DATA_SYNC_KEY: string = "better-brain-topics";

export type ObjectMap<T> = { [key: string]: T }
export type TopicMap = ObjectMap<TopicT>
export type SavedTabMap = ObjectMap<TabT>
export type OpenTabMap = ObjectMap<OpenTabT>;

export const getUUIDv4 = () => {
    let d = new Date().getTime(), d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = Math.random() * 16;
        if (d > 0) {
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
};

type SpecialTopicNames = "Unassorted"
export const SpecialTopics: { [key in SpecialTopicNames]: TopicT } = Object.freeze({
    Unassorted: { name: "Unassorted", uuid: '3348d882-173f-4a4f-b595-c5a5b07c54d7' }
})

/* TOPICS */
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

/* OPEN TABS */
export const getAllOpenTabs = async (): Promise<OpenTabMap> => {
    return new Promise((res, rej) => {
        try {
            chrome.tabs.query({}, (tabResult) => {
                const otm: OpenTabMap = {};
                tabResult.forEach((t) => { if (t.url) { otm[t.url] = { tab: t, uuid: t.url }; } })
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

/* SAVED TABS */
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