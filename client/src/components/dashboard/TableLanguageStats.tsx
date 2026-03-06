import { ILanguageStatistics } from "../../type";
import { ReactElement } from "react";
import { NoData } from "./NoData";

interface Props {
	languageStats: ILanguageStatistics[] | undefined;
}

export const TableLanguageStats = ({ languageStats }: Props): ReactElement => {
	if (!languageStats || languageStats?.length === 0) return <NoData />;

	//TEMPORARY: until translation
	const translationMap: Record<string, string> = {
		language: "Jazyk",
		count: "Počet"
	};

	const languageNameMap: Record<string, string> = {
		cz: "Čeština",
		sk: "Slovenčina",
		en: "Angličtina",
		de: "Nemčina",
		fr: "Francúzština",
		es: "Španielština",
		sv: "Švédština",
		gd: "Galština",
		ru: "Ruština",
	};

	const chartBlue = "rgb(54, 162, 235)";
	const sortedStats = [...languageStats].sort((a, b) => b.count - a.count);
	const totalCount = sortedStats.reduce((sum, stat) => sum + stat.count, 0);

	const rows: any[] = Object.keys(sortedStats);
	const columns: any[] = Object.keys(sortedStats[0] || {}).sort().reverse(); // reverse alphabetical order

	const getLanguageName = (languageCode: string) =>
		languageNameMap[languageCode.toLowerCase()] ?? languageCode;

	const getBarStyle = (count: number) => {
		const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0;
		return {
			background: `linear-gradient(90deg, ${chartBlue} ${ratio}%, transparent ${ratio}%)`
		};
	};

	return (
		<>
			<table className="phone-table" border={1} cellPadding="8" cellSpacing="0" style={{ width: "100%", textAlign: "center" }}>
				<thead>
					<tr>
						<th style={{ width: "35%" }}>Jazyk</th>
						<th>Počet</th>
					</tr>
				</thead>
				<tbody>
					{sortedStats.map((stat, index) => (
						<tr key={index}>
							<td style={{ width: "35%" }}>{getLanguageName(stat.language)}</td>
							<td style={getBarStyle(stat.count)}>{stat.count}</td>
						</tr>
					))}
				</tbody>
			</table>

			<table className="desktop-table" border={1} cellPadding="10" cellSpacing="0" style={{ width: "100%", textAlign: "center" }}>
				<thead>
					<tr>
						{columns.map((column: string) => (
							<th key={column} style={column === "language" ? { width: "35%" } : undefined}>
								{translationMap[column]}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row: string) => (
						<tr key={row}>
							{columns.map((column: string) => {
								const stat = sortedStats[parseInt(row)];
								if (column === "language") {
									return (
										<td key={column} style={{ width: "35%" }}>
											{getLanguageName(stat.language)}
										</td>
									);
								}

								if (column === "count") {
									return (
										<td key={column} style={getBarStyle(stat.count)}>
											{stat.count}
										</td>
									);
								}

								return (
									<td key={column}>
										{stat[column as keyof ILanguageStatistics]}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</>
	)
}