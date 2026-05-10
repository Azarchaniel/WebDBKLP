import React from "react";
import { useTranslation } from "react-i18next";
import useOnlineStatus from "@utils/hooks/useOnlineStatus";

const OfflineBanner: React.FC = () => {
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();

    if (isOnline) return null;

    return (
        <div className="offline-banner" role="status" aria-live="polite">
            <span>{t("network.offlineBanner", "You are offline — showing cached data")}</span>
        </div>
    );
};

export default OfflineBanner;
