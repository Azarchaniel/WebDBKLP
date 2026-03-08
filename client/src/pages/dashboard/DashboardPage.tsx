import { useEffect, useState } from "react";
import '../../styles/DashboardPage.scss';
import { countBooks, getDimensionsStatistics, getLanguageStatistics, getReadBy, getSizeGroups } from "../../API";
import { DashboardPieChart } from "@components/dashboard/DashboardPieChart";
import { DashboardTableStats } from "@components/dashboard/TableDimensionStats";
import { IDimensionsStatistics, ILanguageStatistics, IUserReadingStats } from "../../type";
import { TableCountRatio } from "@components/dashboard/TableCountRatio";
import { TableLanguageStats } from "@components/dashboard/TableLanguageStats";
import { Tab, Tabs } from "@components/Tabs";
import { ReadByChart } from "@components/dashboard/ReadByChart";
import { useAuth } from "@utils/context";
import { LoadingBooks } from "@components/LoadingBooks";
import { NoData } from "@components/dashboard/NoData";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
    const { t } = useTranslation();
    const { currentUser, isLoading: isAuthLoading } = useAuth();
    const [countAllBooks, setCountAllBooks] = useState<{
        owner: { id: string, firstName: string, lastName: string } | null,
        count: number
    }[]>([]);
    const [dimensionStats, setDimensionStats] = useState<IDimensionsStatistics>();
    const [sizeGroups, setSizeGroups] = useState<any>();
    const [langStats, setLangStats] = useState<ILanguageStatistics[]>();
    const [readBy, setReadBy] = useState<IUserReadingStats[]>();
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (isAuthLoading || !currentUser) {
            setCountAllBooks([]);
            setDimensionStats(undefined);
            setSizeGroups(undefined);
            setLangStats(undefined);
            setReadBy(undefined);
            setIsLoadingData(false);
            return;
        }

        setIsLoadingData(true);

        Promise.all([
            countBooks(),
            getDimensionsStatistics(),
            getSizeGroups(),
            getLanguageStatistics(),
            getReadBy()
        ]).then(([countResult, dimResult, sizeResult, langResult, readByResult]) => {
            setCountAllBooks(countResult.data);
            setDimensionStats(dimResult.data);
            setSizeGroups(sizeResult.data);
            setLangStats(langResult.data);
            setReadBy(readByResult.data);
        }).catch((err) => {
            console.error("Error fetching dashboard data:", err);
        }).finally(() => {
            setIsLoadingData(false);
        });
    }, [currentUser, isAuthLoading]);

    const getTabsForReadByStats = (): any => {
        const isDataEmpty = readBy?.every(userStat => userStat.stats.every(stat => stat.count === 0));
        if (!readBy || isDataEmpty) return <NoData />;

        return (
            <Tabs>
                {readBy.map((user: any) => {
                    return <Tab key={user.name} label={user.name}>
                        <ReadByChart data={user.stats} />
                    </Tab>
                })}
            </Tabs>
        )

    }

    return (
        <div className="dashboardContainer">
            {isLoadingData && <LoadingBooks />}
            <div className="dashboardItem">
                <DashboardPieChart data={countAllBooks} />
            </div>
            <div className="dashboardItem">
                {getTabsForReadByStats()}
            </div>
            <div className="dashboardItem">
                <TableLanguageStats languageStats={langStats} />
            </div>
            <div className="dashboardItem">
                <TableCountRatio data={sizeGroups?.height} title={t("dashboard.heightCm")} />
            </div>
            <div className="dashboardItem">
                <TableCountRatio data={sizeGroups?.width} title={t("dashboard.widthCm")} />
            </div>
            <div className="dashboardItem">
                <DashboardTableStats dimensionStats={dimensionStats} />
            </div>
        </div>
    );
}