import {useEffect, useState} from "react";
import {countBooks, getDimensionsStatistics, getLanguageStatistics, getReadBy, getSizeGroups} from "../../API";
import {DashboardPieChart} from "@components/dashboard/DashboardPieChart";
import {DashboardTableStats} from "@components/dashboard/DashboardTableStats";
import {IDimensionsStatistics, ILanguageStatistics, IUserReadingStats} from "../../type";
import {TableCountRatio} from "@components/dashboard/TableCountRatio";
import {TableLanguageStats} from "@components/dashboard/TableLanguageStats";
import {Tab, Tabs} from "@components/Tabs";
import {ReadByChart} from "@components/dashboard/ReadByChart";
import {useAuth} from "@utils/context";
import {LoadingBooks} from "@components/LoadingBooks";

export default function DashboardPage() {
    const {currentUser, isLoading: isAuthLoading} = useAuth();
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
        // Don't fetch if auth is still loading or if user is not logged in
        if (isAuthLoading || !currentUser) {
            // Optional: Clear previous data if user logs out
            setCountAllBooks([]);
            setDimensionStats(undefined);
            setSizeGroups(undefined);
            setLangStats(undefined);
            setReadBy(undefined);
            setIsLoadingData(false); // Not loading dashboard data if no user
            return;
        }

        setIsLoadingData(true); // Start loading dashboard data

        // Use Promise.all for concurrent fetching
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
            // Handle errors appropriately, maybe show a message
        }).finally(() => {
            setIsLoadingData(false); // Finish loading dashboard data
        });
    }, [currentUser, isAuthLoading]);

    const getTabsForReadByStats = (): any => {
        const isDataEmpty = readBy?.every(userStat => userStat.stats.every(stat => stat.count === 0));
        if (!readBy || isDataEmpty) return <span>Žiadne dáta</span>;

        return (
            <Tabs>
                {readBy.map((user: any) => {
                    return <Tab key={user.name} label={user.name}>
                        <ReadByChart data={user.stats}/>
                    </Tab>
                })}
            </Tabs>
        )

    }

    return (
        <div className="dashboardContainer">
            {isLoadingData && <LoadingBooks/>}
            <div className="dashboardItem" style={{padding: 0}}>
                <DashboardPieChart data={countAllBooks}/>
            </div>
            <div className="dashboardItem" style={{padding: 0}}>
                {getTabsForReadByStats()}
            </div>
            <div className="dashboardItem">
                <TableLanguageStats languageStats={langStats}/>
            </div>
            <div className="dashboardItem">
                <TableCountRatio data={sizeGroups?.height} title="Výška (cm)"/>
            </div>
            <div className="dashboardItem">
                <TableCountRatio data={sizeGroups?.width} title="Šírka (cm)"/>
            </div>
            <div className="dashboardItem">
                <DashboardTableStats dimensionStats={dimensionStats}/>
            </div>
        </div>
    );
}