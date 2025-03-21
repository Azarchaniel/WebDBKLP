// src/utils/indexedDBService.ts
import { openDB, IDBPDatabase } from 'idb';
import { IBook } from '../type';

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
}

// Database name and version
const DB_NAME = 'books-cache';
const DB_VERSION = 1;
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

let dbPromise: Promise<IDBPDatabase<BookDB>> | null = null;

/**
 * Initialize and get database instance
 */
export const getDB = (): Promise<IDBPDatabase<BookDB>> => {
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
            },
        });
    }
    return dbPromise;
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
        console.error("Cannot get cached timestamp",err);
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