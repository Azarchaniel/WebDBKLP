import {useEffect, RefObject} from 'react';

type Handler = (event: MouseEvent) => void;

export function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: Handler,
    exceptRef?: RefObject<T>
): void {
    useEffect(() => {
        const listener = (event: MouseEvent) => {
            const el = ref?.current;
            const exceptEl = exceptRef?.current;

            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(event.target as Node) || (exceptEl && exceptEl.contains(event.target as Node))) {
                return;
            }

            handler(event);
        };

        document.addEventListener('mousedown', listener);
        //document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            //document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, exceptRef]);
}
