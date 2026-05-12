// src/utils/indexedDBService.ts
import { openDB, deleteDB, IDBPDatabase } from 'idb';
import { IAutor, IBoardGame, IBook, ILP, IQuote } from '../type';

// Define database schema
export interface BookDB {
    books: {
        key: string;
        value: IBook;
    };
    metadata: {
        key: string;
        value: any;
    };
    lps: {
        key: string;
        value: ILP;
    };
    autors: {
        key: string;
        value: IAutor;
    };
    boardGames: {
        key: string;
        value: IBoardGame;
    };
    quotes: {
        key: string;
        value: IQuote;
    };
}

export type CollectionStoreName = 'lps' | 'autors' | 'boardGames' | 'quotes' | 'books';

// Database name and version
const DB_NAME = 'books-cache';
const DB_VERSION = 2;
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

let dbPromise: Promise<IDBPDatabase<BookDB>> | null = null;

/**
 * Initialize and get database instance
 */
export const getDB = async (): Promise<IDBPDatabase<BookDB>> => {
    if (!dbPromise) {
        dbPromise = openDB<BookDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Create stores if they don't exist
                if (!db.objectStoreNames.contains('books')) {
                    db.createObjectStore('books', { keyPath: '_id' });
                }
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('lps')) {
                    db.createObjectStore('lps', { keyPath: '_id' });
                }
                if (!db.objectStoreNames.contains('autors')) {
                    db.createObjectStore('autors', { keyPath: '_id' });
                }
                if (!db.objectStoreNames.contains('boardGames')) {
                    db.createObjectStore('boardGames', { keyPath: '_id' });
                }
                if (!db.objectStoreNames.contains('quotes')) {
                    db.createObjectStore('quotes', { keyPath: '_id' });
                }
            },
            terminated() {
                // DB was externally deleted or connection was killed — force re-open on next access
                dbPromise = null;
            }
        }).catch((err) => {
            dbPromise = null;
            throw err;
        });
    }

    const db = await dbPromise;

    // Guard against external deletion: if the stores are gone but terminated() hasn't
    // fired yet, close the stale connection, wipe the DB and re-open from scratch.
    if (!db.objectStoreNames.contains('books') || !db.objectStoreNames.contains('metadata')) {
        db.close();
        dbPromise = null;
        await deleteDB(DB_NAME);
        return getDB();
    }

    return db;
};

/**
 * Save books to cache
 * @param books Array of books to cache
 * @param count Total count of books
 * @param pagination Pagination settings
 */
export const saveFirstPageToCache = async (books: IBook[], count: number, pagination: any): Promise<void> => {
    try {
        const db = await getDB();

        // If the PWA background cache has already populated the books store with the full
        // collection, don't wipe it — just refresh the firstPageData metadata.
        const bgCacheMeta = await db.get('metadata', 'books-meta');
        if (bgCacheMeta) {
            await db.put('metadata', {
                key: 'firstPageData',
                count,
                pagination,
                timestamp: new Date().getTime()
            });
            return;
        }

        const tx = db.transaction(['books', 'metadata'], 'readwrite');

        // Clear existing books before adding new ones
        await tx.objectStore('books').clear();

        // Add each book to the store
        for (const book of books) {
            await tx.objectStore('books').put(book);
        }

        // Save metadata
        await tx.objectStore('metadata').put({
            key: 'firstPageData',
            count,
            pagination,
            timestamp: new Date().getTime()
        });

        await tx.done;
    } catch (error) {
        console.error('Error saving to IndexedDB cache:', error);
    }
};

export const getCachedTimestamp = async () => {
    try {
        const db = await getDB();

        const metadata = await db.get('metadata', 'firstPageData');
        return metadata?.timestamp;
    } catch (err) {
        console.error("Cannot get cached timestamp", err);
    }
}

/**
 * Load books from cache
 * @returns Cached books data or null if cache is invalid
 */
export const loadFirstPageFromCache = async (): Promise<{ books: IBook[], count: number } | null> => {
    try {
        const db = await getDB();

        // Check if we have metadata
        const metadata = await db.get('metadata', 'firstPageData');

        // If metadata is older than expiry time, don't use cache
        if (!metadata || (new Date().getTime() - metadata.timestamp > CACHE_EXPIRY)) {
            return null;
        }

        // Get all books from store
        const books = await db.getAll('books');

        return books.length > 0 ? { books, count: metadata.count } : null;
    } catch (error) {
        console.error('Error loading from IndexedDB cache:', error);
        return null;
    }
};

/**
 * Clear all data from the cache
 */
export const clearCache = async (): Promise<void> => {
    try {
        const db = await getDB();
        const tx = db.transaction(['books', 'metadata'], 'readwrite');
        await tx.objectStore('books').clear();
        await tx.objectStore('metadata').clear();
        await tx.done;
    } catch (error) {
        console.error('Error clearing IndexedDB cache:', error);
    }
};

/**
 * Check if cache is available and valid
 */
export const isCacheValid = async (): Promise<boolean> => {
    try {
        const db = await getDB();
        const metadata = await db.get('metadata', 'firstPageData');
        return !!metadata && (new Date().getTime() - metadata.timestamp <= CACHE_EXPIRY);
    } catch (error) {
        return false;
    }
};

const DASHBOARD_CACHE_KEY = 'dashboardData';

/**
 * Save dashboard data to cache
 * @param data All dashboard API results
 * @param userId The current user's _id (used to invalidate on user switch)
 */
export const saveDashboardToCache = async (data: any, userId: string | undefined): Promise<void> => {
    try {
        const db = await getDB();
        await db.put('metadata', {
            key: DASHBOARD_CACHE_KEY,
            data,
            userId,
            timestamp: new Date().getTime()
        });
    } catch (error) {
        console.error('Error saving dashboard to IndexedDB cache:', error);
    }
};

/**
 * Load dashboard data from cache
 * @param userId The current user's _id – returns null if user has changed
 * @returns Cached dashboard data or null if cache is missing/expired/stale
 */
export const loadDashboardFromCache = async (userId: string | undefined): Promise<any | null> => {
    try {
        const db = await getDB();
        const metadata = await db.get('metadata', DASHBOARD_CACHE_KEY);

        if (!metadata || (new Date().getTime() - metadata.timestamp > CACHE_EXPIRY)) {
            return null;
        }

        if (metadata.userId !== userId) {
            return null;
        }

        return metadata.data ?? null;
    } catch (error) {
        console.error('Error loading dashboard from IndexedDB cache:', error);
        return null;
    }
};

/**
 * Get the timestamp of the cached dashboard data
 */
export const getDashboardCachedTimestamp = async (): Promise<number | undefined> => {
    try {
        const db = await getDB();
        const metadata = await db.get('metadata', DASHBOARD_CACHE_KEY);
        return metadata?.timestamp;
    } catch (err) {
        console.error('Cannot get dashboard cached timestamp', err);
    }
};

// ─── Generic collection cache helpers ────────────────────────────────────────

/**
 * Save all items of a collection to IndexedDB, replacing any previous contents.
 * @param store   One of the non-book collection stores
 * @param items   Array of records (must each have `_id`)
 * @param metaKey Metadata key for this collection (e.g. 'lps-meta')
 * @param latestUpdate ISO string representing the newest updatedAt on the server
 */
export const saveCollectionToCache = async (
    store: CollectionStoreName,
    items: any[],
    metaKey: string,
    latestUpdate: string,
    serverCount?: number,
): Promise<void> => {
    try {
        const db = await getDB();
        const tx = db.transaction([store, 'metadata'] as const, 'readwrite');
        const itemStore = tx.objectStore(store);
        await (itemStore as any).clear();
        for (const item of items) {
            await (itemStore as any).put(item);
        }
        await tx.objectStore('metadata').put({
            key: metaKey,
            latestUpdate,
            timestamp: Date.now(),
            serverCount: serverCount ?? items.length,
        });
        await tx.done;
    } catch (error) {
        console.error(`Error saving ${store} to cache:`, error);
    }
};

/**
 * Load all items of a collection from IndexedDB.
 * Returns null if the store is empty or the cached data is older than CACHE_EXPIRY.
 */
export const loadCollectionFromCache = async <T,>(
    store: CollectionStoreName,
    metaKey: string
): Promise<{ items: T[]; latestUpdate: string } | null> => {
    try {
        const db = await getDB();
        const meta = await db.get('metadata', metaKey);
        if (!meta || Date.now() - meta.timestamp > CACHE_EXPIRY) return null;
        const items = await (db as any).getAll(store) as T[];
        return items.length > 0 ? { items, latestUpdate: meta.latestUpdate } : null;
    } catch (error) {
        console.error(`Error loading ${store} from cache:`, error);
        return null;
    }
};

/**
 * Return only the cached latestUpdate timestamp for a collection (for change detection).
 */
export const getCachedCollectionLatestUpdate = async (metaKey: string): Promise<string | null> => {
    try {
        const db = await getDB();
        const meta = await db.get('metadata', metaKey);
        return meta?.latestUpdate ?? null;
    } catch (err) {
        console.error('Cannot get cached latestUpdate for', metaKey, err);
        return null;
    }
};

// ─── Collection meta-key constants ───────────────────────────────────────────
export const META_KEY_LPS = 'lps-meta';
export const META_KEY_AUTORS = 'autors-meta';
export const META_KEY_BOARD_GAMES = 'boardGames-meta';
export const META_KEY_QUOTES = 'quotes-meta';
export const META_KEY_BOOKS = 'books-meta';

/**
 * Returns the count of items currently in each IndexedDB store and the
 * server-side total that was recorded when the data was last downloaded.
 */
export const getAllCachedCounts = async (): Promise<{
    cached: Record<string, number>;
    serverCounts: Record<string, number>;
}> => {
    try {
        const db = await getDB();
        const [booksC, autorsC, lpsC, bgC, quotesC] = await Promise.all([
            db.count('books'),
            db.count('autors'),
            db.count('lps'),
            db.count('boardGames'),
            db.count('quotes'),
        ]);
        const [booksMeta, autorsMeta, lpsMeta, bgMeta, quotesMeta] = await Promise.all([
            db.get('metadata', META_KEY_BOOKS),
            db.get('metadata', META_KEY_AUTORS),
            db.get('metadata', META_KEY_LPS),
            db.get('metadata', META_KEY_BOARD_GAMES),
            db.get('metadata', META_KEY_QUOTES),
        ]);
        return {
            cached: { books: booksC, autors: autorsC, lps: lpsC, boardGames: bgC, quotes: quotesC },
            serverCounts: {
                books: booksMeta?.serverCount ?? 0,
                autors: autorsMeta?.serverCount ?? 0,
                lps: lpsMeta?.serverCount ?? 0,
                boardGames: bgMeta?.serverCount ?? 0,
                quotes: quotesMeta?.serverCount ?? 0,
            },
        };
    } catch {
        return {
            cached: { books: 0, autors: 0, lps: 0, boardGames: 0, quotes: 0 },
            serverCounts: { books: 0, autors: 0, lps: 0, boardGames: 0, quotes: 0 },
        };
    }
};

/**
 * Refresh only the metadata record for a collection (timestamp + latestUpdate)
 * without touching the items store. Use when the server confirms data is current
 * (returns empty array + latestUpdate) to prevent premature cache expiry.
 */
export const touchCollectionCache = async (metaKey: string, latestUpdate: string): Promise<void> => {
    try {
        const db = await getDB();
        const existing = await db.get('metadata', metaKey);
        await db.put('metadata', {
            ...(existing ?? { key: metaKey }),
            key: metaKey,
            latestUpdate,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error(`Error touching cache metadata for ${metaKey}:`, error);
    }
};

/**
 * Sort an array of cached items by a dynamic field using locale-aware comparison.
 * Accepts a `sorting` array that matches TanStack Table's `SortingState` shape.
 * Pure function — does not modify the original array.
 */
export function sortCachedItems<T>(
    items: T[],
    sorting: Array<{ id: string; desc: boolean }> | undefined,
    defaultField: string,
): T[] {
    const [sortInfo] = sorting ?? [];
    const sortField = sortInfo?.id ?? defaultField;
    const sortDesc = sortInfo?.desc ?? false;
    return items.slice().sort((a, b) => {
        const cmp = String((a as any)[sortField] ?? '').localeCompare(
            String((b as any)[sortField] ?? ''),
            undefined,
            { numeric: true },
        );
        return sortDesc ? -cmp : cmp;
    });
}
