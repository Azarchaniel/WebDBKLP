/**
 * PWA subsystem — fully self-contained.
 *
 * Exposes a single hook, `usePWALayout()`, that encapsulates every concern the
 * rest of the application should not need to know about:
 *
 *  • online / offline detection and toast notifications
 *  • background sync progress tracking (PWA-only)
 *  • banner visibility and positioning
 *  • content margin calculation
 *
 * Usage in Layout (or any shell component):
 *
 *   const { marginTop, banners } = usePWALayout();
 *   return (
 *     <main style={{ marginTop }}>
 *       <Header />
 *       {banners}
 *       ...
 *     </main>
 *   );
 */

import React from 'react';
import useNetworkStatus from '@utils/hooks/useNetworkStatus';
import useOnlineStatus from '@utils/hooks/useOnlineStatus';
import { usePWASync } from '@hooks';
import OfflineBanner from '../components/OfflineBanner';
import PWASyncBanner from '../components/PWASyncBanner';

// ─── Height constants — must match values in header.scss ─────────────────────
const HEADER_H = '3rem';
/** Must match .pwa-sync-banner height in header.scss */
const SYNC_BANNER_H = '1.75rem';
/** Must match .offline-banner computed height in header.scss */
const OFFLINE_BANNER_H = '2rem';

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PWALayoutInfo {
    /** CSS value to apply as `margin-top` on the main content area. */
    marginTop: string;
    /** Banner nodes to render directly below the fixed header. */
    banners: React.ReactNode;
}

/**
 * Manages all PWA and network-status UI concerns in one place.
 * Returns the content margin and the banner elements — nothing else leaks out.
 */
export function usePWALayout(): PWALayoutInfo {
    // Side-effect only: shows toast on online/offline transition
    useNetworkStatus();

    const isOnline = useOnlineStatus();
    const syncInfo = usePWASync();

    const showSyncBanner = syncInfo.isPWA && (syncInfo.isSyncing || syncInfo.percentage < 100);

    const extraOffset = [
        !isOnline ? OFFLINE_BANNER_H : null,
        showSyncBanner ? SYNC_BANNER_H : null,
    ].filter(Boolean) as string[];

    const marginTop =
        extraOffset.length > 0
            ? `calc(${HEADER_H} + ${extraOffset.join(' + ')})`
            : HEADER_H;

    // The sync banner sits just below the offline banner (when shown) or the header
    const syncBannerTop = !isOnline
        ? `calc(${HEADER_H} + ${OFFLINE_BANNER_H})`
        : HEADER_H;

    const banners = (
        <>
            <OfflineBanner />
            {showSyncBanner && (
                <PWASyncBanner
                    {...syncInfo}
                    isOnline={isOnline}
                    offsetTop={syncBannerTop}
                />
            )}
        </>
    );

    return { marginTop, banners };
}
