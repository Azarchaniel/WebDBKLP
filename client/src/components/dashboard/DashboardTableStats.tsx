interface Props {
	dimensionStats: any;
}

export const DashboardTableStats = ({dimensionStats}: Props) => {
	// if no data, then it is: { height: {}, width: {}, depth: {}, weight: {} }
	if (!dimensionStats || Object.values(dimensionStats).every((v: any) => Object.keys(v).length === 0)) return <>Žiadne dáta</>;

	//TEMPORARY: until translation
	const translationMap: Record<string, string> = {
		height: "Výška (cm)",
		width: "Šírka (cm)",
		depth: "Hrúbka (cm)",
		weight: "Hmotnosť (g)",
		sum: "Suma",
		avg: "Priemer",
		min: "Min",
		max: "Max",
		mode: "Modus",
		median: "Medián"
	};

	const rows: any[] = Object.keys(dimensionStats);
	const columns: any[] = Object.keys(dimensionStats.height);

	return (
		<div>
			<table border={1} cellPadding="10" cellSpacing="0" style={{width: "100%", textAlign: "center"}}>
				<thead>
					<tr>
						<th className="firstCell" />
						{columns.map((column) => (
							<th key={column}>{translationMap[column]}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row: string) => (
						<tr key={row}>
							<td><b>{translationMap[row]}</b></td>
							{columns.map((column) => (
								<td key={column}>{Math.round(dimensionStats[row][column] * 10) / 10}</td>
								))}
						</tr>
					))}
				</tbody>
			</table>
			<div style={{height: "1rem"}}/>
		</div>
	);
};