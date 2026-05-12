import React from "react";
import { useTranslation } from "react-i18next";
import type { PWASyncInfo } from "../utils/hooks/usePWASync";

interface Props extends PWASyncInfo {
    isOnline: boolean;
    /** When the offline banner is also showing, the sync banner must sit below it */
    offsetTop?: string;
}

const PWASyncBanner: React.FC<Props> = ({
    isSyncing,
    percentage,
    cachedItems,
    serverItems,
    isOnline,
    offsetTop = "3rem",
}) => {
    const { t } = useTranslation();

    let label: string;
    if (isSyncing && isOnline) {
        label = t("network.pwaDownloading", { pct: percentage });
    } else if (percentage >= 100) {
        label = t("network.pwaFullyCached", { count: cachedItems });
    } else if (!isOnline) {
        label = t("network.pwaOfflinePartial", { pct: percentage, count: cachedItems, total: serverItems });
    } else {
        label = t("network.pwaPartial", { pct: percentage, count: cachedItems, total: serverItems });
    }

    return (
        <div
            className={`pwa-sync-banner${isSyncing ? " pwa-sync-banner--syncing" : ""}`}
            role="status"
            aria-live="polite"
            style={{ top: offsetTop }}
        >
            <div
                className="pwa-sync-banner__bar"
                style={{ width: `${percentage}%` }}
                aria-hidden="true"
            />
            <span className="pwa-sync-banner__text">
                {isSyncing && <span className="pwa-sync-banner__spinner" aria-hidden="true" />}
                {label}
            </span>
        </div>
    );
};

export default PWASyncBanner;
