import { useEffect, useRef, useState } from 'react';
import {
    checkBooksUpdated,
    getAllQuotesForCache,
    getAutors,
    getBoardGames,
    getBooks,
    getLPs,
} from '../../API';
import {
    getAllCachedCounts,
    getCachedCollectionLatestUpdate,
    getDB,
    META_KEY_AUTORS,
    META_KEY_BOARD_GAMES,
    META_KEY_BOOKS,
    META_KEY_LPS,
    META_KEY_QUOTES,
    saveCollectionToCache,
    touchCollectionCache,
} from '../indexDb';

const isPWAMode = (): boolean =>
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as any).standalone);

const sumValues = (obj: Record<string, number>): number =>
    Object.values(obj).reduce((a, b) => a + b, 0);

export interface PWASyncInfo {
    isPWA: boolean;
    isSyncing: boolean;
    /** 0–100, or 0 when server totals not yet known */
    percentage: number;
    cachedItems: number;
    serverItems: number;
}

export function usePWASync(): PWASyncInfo {
    const [info, setInfo] = useState<PWASyncInfo>({
        isPWA: false,
        isSyncing: false,
        percentage: 0,
        cachedItems: 0,
        serverItems: 0,
    });
    const didRun = useRef(false);

    useEffect(() => {
        if (didRun.current) return;
        didRun.current = true;

        const pwa = isPWAMode();
        if (!pwa) return;

        setInfo(prev => ({ ...prev, isPWA: true }));

        // Show the current cache state immediately (from what's already in IndexedDB)
        refreshProgress(setInfo);

        const timer = setTimeout(() => {
            if (!navigator.onLine) return;
            runSync(setInfo);
        }, 3000);

        return () => clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return info;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function refreshProgress(
    setInfo: React.Dispatch<React.SetStateAction<PWASyncInfo>>
): Promise<void> {
    const { cached, serverCounts } = await getAllCachedCounts();
    const totalCached = sumValues(cached);
    const totalServer = sumValues(serverCounts);
    setInfo(prev => ({
        ...prev,
        cachedItems: totalCached,
        serverItems: totalServer,
        percentage: totalServer > 0
            ? Math.min(100, Math.round((totalCached / totalServer) * 100))
            : prev.percentage,
    }));
}

async function runSync(
    setInfo: React.Dispatch<React.SetStateAction<PWASyncInfo>>
): Promise<void> {
    setInfo(prev => ({ ...prev, isSyncing: true }));

    await Promise.allSettled([
        syncBooks(setInfo),
        syncAutors(setInfo),
        syncLPs(setInfo),
        syncBoardGames(setInfo),
        syncQuotes(setInfo),
    ]);

    // Final authoritative count after all downloads
    await refreshProgress(setInfo);
    setInfo(prev => ({ ...prev, isSyncing: false }));
}

// ─── Per-collection sync functions ───────────────────────────────────────────

async function syncBooks(
    setInfo: React.Dispatch<React.SetStateAction<PWASyncInfo>>
): Promise<void> {
    try {
        const dataFrom = await getCachedCollectionLatestUpdate(META_KEY_BOOKS);
        if (dataFrom) {
            try {
                const { status } = await checkBooksUpdated(new Date(dataFrom));
                if (status === 204) {
                    // Data unchanged — just refresh the cache timestamp
                    const db = await getDB();
                    const existing = await db.get('metadata', META_KEY_BOOKS);
                    if (existing) await db.put('metadata', { ...existing, timestamp: Date.now() });
                    await refreshProgress(setInfo);
                    return;
                }
            } catch { /* server unreachable — fall through to full fetch */ }
        }
        const { data } = await getBooks({ page: 1, pageSize: 10000, search: '' });
        const items = data.books ?? [];
        await saveCollectionToCache('books', items, META_KEY_BOOKS, new Date().toISOString(), data.count ?? items.length);
        await refreshProgress(setInfo);
    } catch { /* silent — user already has paginated data */ }
}

async function syncAutors(
    setInfo: React.Dispatch<React.SetStateAction<PWASyncInfo>>
): Promise<void> {
    try {
        const dataFrom = await getCachedCollectionLatestUpdate(META_KEY_AUTORS);
        const { data } = await getAutors({ page: 1, pageSize: 10000, search: '', dataFrom: dataFrom ?? undefined });
        const items = data.autors ?? [];
        if (items.length > 0 && data.latestUpdate) {
            await saveCollectionToCache('autors', items, META_KEY_AUTORS, String(data.latestUpdate), data.count ?? items.length);
        } else if (data.latestUpdate) {
            await touchCollectionCache(META_KEY_AUTORS, String(data.latestUpdate));
        }
        await refreshProgress(setInfo);
    } catch { /* silent */ }
}

async function syncLPs(
    setInfo: React.Dispatch<React.SetStateAction<PWASyncInfo>>
): Promise<void> {
    try {
        const dataFrom = await getCachedCollectionLatestUpdate(META_KEY_LPS);
        const { data } = await getLPs({ page: 1, pageSize: 10000, search: '', dataFrom: dataFrom ?? undefined });
        const items = data.lps ?? [];
        if (items.length > 0 && data.latestUpdate) {
            await saveCollectionToCache('lps', items, META_KEY_LPS, String(data.latestUpdate), data.count ?? items.length);
        } else if (data.latestUpdate) {
            await touchCollectionCache(META_KEY_LPS, String(data.latestUpdate));
        }
        await refreshProgress(setInfo);
    } catch { /* silent */ }
}

async function syncBoardGames(
    setInfo: React.Dispatch<React.SetStateAction<PWASyncInfo>>
): Promise<void> {
    try {
        const dataFrom = await getCachedCollectionLatestUpdate(META_KEY_BOARD_GAMES);
        const { data } = await getBoardGames({ page: 1, pageSize: 10000, search: '', dataFrom: dataFrom ?? undefined });
        const items = data.boardGames ?? [];
        if (items.length > 0 && data.latestUpdate) {
            await saveCollectionToCache('boardGames', items, META_KEY_BOARD_GAMES, String(data.latestUpdate), data.count ?? items.length);
        } else if (data.latestUpdate) {
            await touchCollectionCache(META_KEY_BOARD_GAMES, String(data.latestUpdate));
        }
        await refreshProgress(setInfo);
    } catch { /* silent */ }
}

async function syncQuotes(
    setInfo: React.Dispatch<React.SetStateAction<PWASyncInfo>>
): Promise<void> {
    try {
        const dataFrom = await getCachedCollectionLatestUpdate(META_KEY_QUOTES);
        const { data } = await getAllQuotesForCache(dataFrom);
        const items = (data as any).quotes ?? [];
        const latestUpdate = (data as any).latestUpdate;
        if (items.length > 0 && latestUpdate) {
            await saveCollectionToCache('quotes', items, META_KEY_QUOTES, latestUpdate, (data as any).count ?? items.length);
        } else if (latestUpdate) {
            await touchCollectionCache(META_KEY_QUOTES, latestUpdate);
        }
        await refreshProgress(setInfo);
    } catch { /* silent */ }
}
