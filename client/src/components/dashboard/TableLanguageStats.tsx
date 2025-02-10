import {ILanguageStatistics} from "../../type";
import {ReactElement} from "react";
import {Bar} from "react-chartjs-2";

interface Props {
    languageStats: ILanguageStatistics[] | undefined;
}

export const TableLanguageStats = ({languageStats}: Props): ReactElement => {
	if (!languageStats || languageStats?.length === 0) return <>Žiadne dáta</>;

	//TEMPORARY: until translation
	const translationMap: Record<string, string> = {
		language: "Jazyk",
		count: "Počet"
	};

	const rows: any[] =
        Object.keys(languageStats.sort((a, b) => b.count - a.count)); //sort higher to lower
	const columns: any[] =
        Object.keys(languageStats[0] || {}).sort().reverse(); // reverse alphabetical order

	const dataChart = {
		labels: languageStats.map(ls => ls.language),
		datasets: [{
			data: languageStats.map(ls => ls.count)
		}],
	};

	const optionsChart = {
		plugins: {
			legend: {
				display: false
			}
		}
	};

	return (
		<div className="tableLangStats">
			<div className="tableSection">
				<table border={1} cellPadding="10" cellSpacing="0" style={{width: "100%", textAlign: "center"}}>
					<thead>
						<tr>
							{columns.map((column: string) => (
								<th key={column}>{translationMap[column]}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row: string) => (
							<tr key={row}>
								{columns.map((column: string) => (
									<td key={column}>{languageStats[parseInt(row)][column as keyof ILanguageStatistics]}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="chartSection">
				<Bar data={dataChart} options={optionsChart}/>
			</div>
		</div>
	)
}