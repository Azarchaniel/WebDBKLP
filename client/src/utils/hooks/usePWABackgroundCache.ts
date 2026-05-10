import { useEffect } from 'react';
import {
    getCachedCollectionLatestUpdate,
    saveCollectionToCache,
    touchCollectionCache,
    CollectionStoreName,
} from '../indexDb';

/**
 * Returns true when the app is running as an installed PWA (standalone display mode).
 * Used to gate background cache population — normal browser sessions use server-side
 * pagination only and never do bulk downloads.
 */
const isPWA = (): boolean =>
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as any).standalone);

interface BackgroundCacheOptions {
    store: CollectionStoreName;
    metaKey: string;
    /**
     * Called with the cached latestUpdate timestamp (or null if no cache).
     * Should return all items (pageSize: 10000) and the server's latestUpdate.
     * When dataFrom is supplied and data is unchanged, the server returns
     * { items: [], latestUpdate } — the hook handles that correctly.
     */
    fetchAll: (dataFrom: string | null) => Promise<{ items: any[]; latestUpdate?: string }>;
    /** Delay (ms) before the background fetch starts to avoid competing with the foreground fetch. Default: 3000 */
    delayMs?: number;
}

/**
 * Populates IndexedDB in the background, but ONLY when the app is running as an
 * installed PWA. In regular browser mode this hook is a no-op, so server-side
 * pagination is the only data path and no bulk download ever happens.
 */
export function usePWABackgroundCache({
    store,
    metaKey,
    fetchAll,
    delayMs = 3000,
}: BackgroundCacheOptions): void {
    useEffect(() => {
        if (!isPWA() || !navigator.onLine) return;

        const timer = setTimeout(async () => {
            try {
                const cachedLatest = await getCachedCollectionLatestUpdate(metaKey);
                const { items, latestUpdate } = await fetchAll(cachedLatest);
                if (items.length > 0 && latestUpdate) {
                    await saveCollectionToCache(store, items, metaKey, latestUpdate);
                } else if (items.length === 0 && latestUpdate) {
                    await touchCollectionCache(metaKey, latestUpdate);
                }
            } catch {
                // Background cache failure is silent — the user already has paginated data
            }
        }, delayMs);

        return () => clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once per mount
}
