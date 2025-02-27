import {useEffect, useState} from "react";
import {countBooks, getDimensionsStatistics, getLanguageStatistics, getReadBy, getSizeGroups} from "../../API";
import {DashboardPieChart} from "../../components/dashboard/DashboardPieChart";
import {DashboardTableStats} from "../../components/dashboard/DashboardTableStats";
import {IDimensionsStatistics, ILanguageStatistics, IUserReadingStats} from "../../type";
import {TableCountRatio} from "../../components/dashboard/TableCountRatio";
import {TableLanguageStats} from "../../components/dashboard/TableLanguageStats";
import {Tab, Tabs} from "../../components/Tabs";
import {ReadByChart} from "../../components/dashboard/ReadByChart";

export default function DashboardPage() {
	const [countAllBooks, setCountAllBooks] = useState<{
        owner: { id: string, firstName: string, lastName: string } | null,
        count: number
    }[]>([]);
	const [dimensionStats, setDimensionStats] = useState<IDimensionsStatistics>();
	const [sizeGroups, setSizeGroups] = useState<any>();
	const [langStats, setLangStats] = useState<ILanguageStatistics[]>();
	const [readBy, setReadBy] = useState<IUserReadingStats[]>();

	useEffect(() => {
		countBooks()
			.then((result: any) => setCountAllBooks(result.data))
			.catch((err: any) => console.error("error counting books FE", err));

		getDimensionsStatistics()
			.then((result: any) => setDimensionStats(result.data))
			.catch((err: any) => console.error("error getDimensionsStatistics FE", err));

		getSizeGroups()
			.then((result: any) => setSizeGroups(result.data))
			.catch((err: any) => console.error("error getSizeGroups FE", err));

		getLanguageStatistics()
			.then((result: any) => setLangStats(result.data))
			.catch((err: any) => console.error("error getDimensionsStatistics FE", err));

		getReadBy()
			.then((result: any) => setReadBy(result.data))
			.catch((err: any) => console.error("error getReadBy FE", err));
	}, [])

	const getTabsForReadByStats = (): any => {
		const isDataEmpty = readBy?.every(userStat => userStat.stats.every(stat => stat.count === 0));
		if (!readBy || isDataEmpty) return <span>Žiadne dáta</span>;

		return (
			<Tabs>
				{readBy.map((user: any) => {
					return <Tab label={user.name}>
						<ReadByChart data={user.stats} />
					</Tab>
				})}
			</Tabs>
		)

	}

	return (
		<div className="dashboardContainer">
			<div className="dashboardItem" style={{padding: 0}} >
				<DashboardPieChart data={countAllBooks} />
			</div>
			<div className="dashboardItem" style={{padding:0, paddingRight: "1rem"}} >
				{getTabsForReadByStats()}
			</div>
			<div className="dashboardItem">
				<TableLanguageStats languageStats={langStats} />
			</div>
			<div className="dashboardItem">
				<TableCountRatio data={sizeGroups?.height} title="Výška (cm)" />
			</div>
			<div className="dashboardItem">
				<TableCountRatio data={sizeGroups?.width} title="Šírka (cm)" />
			</div>
			<div className="dashboardItem">
				<DashboardTableStats dimensionStats={dimensionStats} />
			</div>
		</div>
	);
}
