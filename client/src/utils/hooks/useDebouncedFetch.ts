import { useState, useEffect, useRef } from 'react';

// Define a generic structure for the expected response from the fetch function
interface FetchResponse<TData> {
    data: TData[];
    count: number;
}

// Define the hook's options
interface UseDebouncedFetchOptions<TParams> {
    debounceKey: keyof TParams; // The key in params to watch for debouncing (e.g., 'search')
    debounceMs?: number;      // Debounce delay in milliseconds (default: 1000)
    fetchOnMount?: boolean;   // Whether to fetch immediately on component mount (default: true)
}

/**
 * Custom hook to fetch data with debouncing based on specific parameters.
 * Fetches immediately if the debounceKey's value is empty, otherwise debounces.
 *
 * @param fetchFn The asynchronous function that performs the data fetching.
 *                It should accept parameters and an optional AbortSignal.
 *                It should return a Promise resolving to an object like { data: TData[], count: number }.
 * @param params The parameters object to pass to the fetchFn. The hook reacts to changes in this object.
 * @param options Configuration options for the hook.
 * @returns An object containing the fetched data, total count, loading state, and error state.
 */
export function useDebouncedFetch<TData, TParams extends Record<string, any>>(
    fetchFn: (params: TParams, signal?: AbortSignal) => Promise<FetchResponse<TData>>,
    params: TParams,
    options: UseDebouncedFetchOptions<TParams>
) {
    const { debounceKey, debounceMs = 1000, fetchOnMount = true } = options;

    const [data, setData] = useState<TData[]>([]);
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(fetchOnMount); // Start loading if fetching on mount
    const [error, setError] = useState<Error | null>(null);

    // Use refs for timeout and controller to avoid triggering re-renders on their change
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
    const controllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef<boolean>(false); // Ref to track initial mount

    useEffect(() => {
        // Track mount status for async operations safety
        let isEffectMounted = true;

        // Skip fetch on initial mount if fetchOnMount is false
        if (!fetchOnMount && !isMountedRef.current) {
            isMountedRef.current = true; // Mark as mounted for subsequent runs
            setLoading(false); // Ensure loading is false if not fetching initially
            return;
        }
        isMountedRef.current = true; // Mark as mounted after the first potential skip

        // --- Abort previous request ---
        controllerRef.current?.abort();
        const newController = new AbortController();
        controllerRef.current = newController;

        // --- Define the actual fetch execution ---
        const executeFetch = async () => {
            if (!isEffectMounted) return; // Don't fetch if effect cleaned up
            setLoading(true);
            setError(null);
            try {
                const response = await fetchFn(params, newController.signal);
                if (isEffectMounted) { // Check mount status *after* await
                    setData(response.data);
                    setCount(response.count);
                }
            } catch (err: any) {
                // Ignore AbortError, handle others if still mounted
                if (err.name !== 'AbortError' && isEffectMounted) {
                    console.error('Fetch error in useDebouncedFetch:', err);
                    setError(err);
                    // Optionally reset data/count on error
                    // setData([]);
                    // setCount(0);
                }
            } finally {
                if (isEffectMounted) {
                    setLoading(false);
                }
            }
        };

        // --- Clear any existing timeout ---
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
        }

        // --- Decide whether to debounce or fetch immediately ---
        const debounceValue = params[debounceKey];
        const shouldDebounce = debounceValue && String(debounceValue).trim() !== "";

        if (shouldDebounce) {
            // Debounce: Set a new timeout
            timeoutIdRef.current = setTimeout(() => {
                executeFetch();
            }, debounceMs);
        } else {
            // No debounce value: Fetch immediately
            executeFetch();
        }

        // --- Cleanup function ---
        return () => {
            isEffectMounted = false; // Mark as unmounted for async safety
            // Clear timeout if it exists when effect re-runs or component unmounts
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
            // Abort the ongoing fetch if effect re-runs or component unmounts
            controllerRef.current?.abort();
        };
    }, [
        // Use JSON.stringify for deep comparison of params.
        // Consider use-deep-compare-effect hook for performance on very large/complex params.
        JSON.stringify(params),
        fetchFn, // Assuming fetchFn is stable (e.g., defined outside component or wrapped in useCallback)
        debounceKey,
        debounceMs,
        fetchOnMount // Include fetchOnMount in dependencies
    ]);

    return { data, count, loading, error };
}