import { useTranslation } from "react-i18next";

export const NoData = () => {
    const { t } = useTranslation();
    return (
        <div className="noData">
            <span>{t("dashboard.noData")}</span>
        </div>
    );
}