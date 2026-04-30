import { useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const useNetworkStatus = () => {
    const { t } = useTranslation();

    useEffect(() => {
        const handleOffline = () => {
            toast.warn(t("network.offline"), { autoClose: false, toastId: "network-offline" });
        };

        const handleOnline = () => {
            toast.dismiss("network-offline");
            toast.success(t("network.online"), { toastId: "network-online" });
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, [t]);
};

export default useNetworkStatus;
