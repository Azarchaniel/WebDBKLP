import React, {useState} from "react";
import { LoadingBooks } from "./LoadingBooks";
import MaterialTable, {Column} from "@material-table/core";

type PropsMT = {
    title: string,
    data: any[],
    columns: Column<any>[],
    actions: any[],
	pageChange: (page: number) => void,
	pageSizeChange: (pageSize: number) => void,
	totalCount: number,
    detailPanel?: any,
    loading?: boolean,
	pagination?: {
		page: number,
		pageSize: number,
	}
}

const MaterialTableCustom: React.FC<PropsMT> = (
	{title, data, columns, actions, detailPanel, loading, pageChange, pageSizeChange, totalCount, pagination}: PropsMT
) => {
	const [showFilter, setShowFilter] = useState(false);

	return (
			<MaterialTable
				title={title}
				columns={columns}
				data={data}
				totalCount={totalCount}
				isLoading={loading}
				options={{
					filtering: showFilter,
					actionsColumnIndex: -1,
					detailPanelColumnAlignment: "right",
					pageSize: pagination?.pageSize ?? 50,
					pageSizeOptions: [5, 20, 50, 100],
					paginationType: "stepped",
					draggable: false,
					rowStyle: {borderBottom: "2px solid lightgray"},
					emptyRowsWhenPaging: false,
					numberOfPagesAround: 2
				}}
				onPageChange={(page) => {
					console.log("page change in table", page)
					pageChange(page);
				}}
				onRowsPerPageChange={(pageSize) => {
					console.log("pageSize change in table", pageSize)
					pageSizeChange(pageSize);
				}}
				actions={[
					...columns,
					...actions,
					{
						icon: "filter_list",
						tooltip: "Zobraz/Skry filter",
						onClick: () => {
							setShowFilter(!showFilter)
						},
						isFreeAction: true,
						iconProps: {
							className: "moveToLeft"
						}
					},
				]}
				localization={{
					body: {emptyDataSourceMessage: "Žiadne záznamy"},
					header: {actions: "Akcie"},
					pagination: {
						labelRowsPerPage: "Záznamov na stranu:",
						labelDisplayedRows: "{from}-{to} z {count}",
						labelRows: "záznamov",
						firstTooltip: "Prvá strana",
						previousTooltip: "Predchádzajúca strana",
						nextTooltip: "Nasledujúca strana",
						lastTooltip: "Posledná strana"
					},
					toolbar: {
						searchTooltip: "Vyhľadávanie",
						searchPlaceholder: "Hľadať"
					}
				}}
				detailPanel={detailPanel}
				components={{
					OverlayLoading: () => {
						return <LoadingBooks />
					}
				}}
			/>
		)
}

export default MaterialTableCustom;