import React, {useState} from "react";

import LoadingBooks from "./LoadingBooks";
import MaterialTable, {Column} from "@material-table/core";

type PropsMT = {
    title: string,
    data: any[],
    columns: Column<any>[],
    actions: any[],
    detailPanel?: any,
    loading?: boolean
}

const MaterialTableCustom: React.FC<PropsMT> = ({title, data, columns, actions, detailPanel, loading}: PropsMT) => {
    const [showFilter, setShowFilter] = useState(false);

    return (
        <MaterialTable
            title={title}
            columns={columns}
            data={data}
            isLoading={loading}
            options={{
                filtering: showFilter,
                actionsColumnIndex: -1,
                detailPanelColumnAlignment: "right",
                pageSize: 50,
                pageSizeOptions: [20, 50, 100],
                paginationType: "stepped",
                draggable: false,
                rowStyle: {borderBottom: '2px solid lightgray'},
                emptyRowsWhenPaging: false,
                numberOfPagesAround: 2
            }}
            actions={[
                ...actions,
                {
                    icon: 'filter_list',
                    tooltip: 'Zobraz/Skry filter',
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
                body: {emptyDataSourceMessage: 'Žiadne záznamy'},
                header: {actions: 'Akcie'},
                pagination: {
                    labelDisplayedRows: '{from}-{to} z {count}',
                    labelRowsSelect: 'záznamov',
                    firstTooltip: 'Prvá strana',
                    previousTooltip: 'Predchádzajúca strana',
                    nextTooltip: 'Nasledujúca strana',
                    lastTooltip: 'Posledná strana'
                },
                toolbar: {
                    searchTooltip: 'Vyhľadávanie',
                    searchPlaceholder: 'Hľadať'
                }
            }}
            detailPanel={detailPanel}
            components={{
                OverlayLoading: () => {
                    return <LoadingBooks />
                }
            }}
        />)
}

export default MaterialTableCustom;