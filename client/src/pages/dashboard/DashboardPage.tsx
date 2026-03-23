import { useEffect, useState } from "react";
import '../../styles/DashboardPage.scss';
import { countBooks, getDimensionsStatistics, getLanguageStatistics, getReadBy, getSizeGroups, getOldestBooks, getNewestBooks, getBiggestBooks } from "../../API";
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
import { TableOldestBooks } from "@components/dashboard/TableOldestBooks";
import { TableNewestBooks } from "@components/dashboard/TableNewestBooks";
import { TableBiggestBooks } from "@components/dashboard/TableBiggestBooks";

interface DashboardTitledCardProps {
    title: string;
    hasData: boolean;
    children: React.ReactNode;
}

const DashboardTitledCard = ({ title, hasData, children }: DashboardTitledCardProps) => {
    return (
        <div className="dashboardTabbedCardContent">
            {hasData && <h5 className="dashboardTitle">{title}</h5>}
            {children}
        </div>
    );
};

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
    const [oldestBooks, setOldestBooks] = useState<any>();
    const [newestBooks, setNewestBooks] = useState<any>();
    const [biggestBooks, setBiggestBooks] = useState<any>();
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (isAuthLoading || !currentUser) {
            setCountAllBooks([]);
            setDimensionStats(undefined);
            setSizeGroups(undefined);
            setLangStats(undefined);
            setReadBy(undefined);
            setOldestBooks(undefined);
            setNewestBooks(undefined);
            setBiggestBooks(undefined);
            setIsLoadingData(false);
            return;
        }

        setIsLoadingData(true);

        Promise.all([
            countBooks(),
            getDimensionsStatistics(),
            getSizeGroups(),
            getLanguageStatistics(),
            getReadBy(),
            getOldestBooks(),
            getNewestBooks(),
            getBiggestBooks("height"),
            getBiggestBooks("width"),
            getBiggestBooks("thickness"),
            getBiggestBooks("weight"),
            getBiggestBooks("square")
        ]).then(([countResult, dimResult, sizeResult, langResult, readByResult, oldestResult, newestResult, heightResult, widthResult, thicknessResult, weightResult, squareResult]) => {
            setCountAllBooks(countResult.data);
            setDimensionStats(dimResult.data);
            setSizeGroups(sizeResult.data);
            setLangStats(langResult.data);
            setReadBy(readByResult.data);
            setOldestBooks(oldestResult.data);
            setNewestBooks(newestResult.data);
            setBiggestBooks({
                height: heightResult.data,
                width: widthResult.data,
                thickness: thicknessResult.data,
                weight: weightResult.data,
                square: squareResult.data
            });
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

    const hasTotalBooksData = Boolean(countAllBooks?.length) && !countAllBooks.every(stat => stat.count === 0);
    const hasReadByData = Boolean(readBy?.length) && !(readBy?.every(userStat => userStat.stats.every(stat => stat.count === 0)) ?? true);

    return (
        <div className="dashboardContainer">
            {isLoadingData && <LoadingBooks />}
            <div className="dashboardItem">
                <DashboardTitledCard title={t("dashboard.totalBooks")} hasData={hasTotalBooksData}>
                    <DashboardPieChart data={countAllBooks} />
                </DashboardTitledCard>
            </div>
            <div className="dashboardItem">
                <DashboardTitledCard title={t("dashboard.readBy")} hasData={hasReadByData}>
                    {getTabsForReadByStats()}
                </DashboardTitledCard>
            </div>
            <div className="dashboardItem">
                <TableNewestBooks newestBooks={newestBooks} />
            </div>
            <div className="dashboardItem">
                <TableOldestBooks oldestBooks={oldestBooks} />
            </div>
            <div className="dashboardItem">
                <TableBiggestBooks biggestBooks={biggestBooks} />
            </div>
            <div className="dashboardItem">
                <TableLanguageStats languageStats={langStats} />
            </div>
            <div className="dashboardItem">
                <TableCountRatio data={sizeGroups?.height} title={t("dashboard.height") + " (cm)"} />
            </div>
            <div className="dashboardItem">
                <TableCountRatio data={sizeGroups?.width} title={t("dashboard.width") + " (cm)"} />
            </div>
            <div className="dashboardItem">
                <DashboardTableStats dimensionStats={dimensionStats} />
            </div>
        </div>
    );
}