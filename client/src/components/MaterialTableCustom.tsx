import React, {useState} from "react";
import MaterialTable, {Column} from "material-table";

type PropsMT = {
    title: string,
    data: any[],
    columns: Column<any>[],
    actions: any[],
    detailPanel?: any,
}

const MaterialTableCustom: React.FC<PropsMT> = ({title, data, columns, actions, detailPanel}: PropsMT) => {
    const [showFilter, setShowFilter] = useState(false);

    return (
        <MaterialTable
            title={title}
            columns={columns}
            data={data}
            options={{
                filtering: showFilter,
                actionsColumnIndex: -1,
                detailPanelColumnAlignment: "right",
                pageSize: 50,
                pageSizeOptions: [20, 50, 100],
                paginationType: "stepped",
                draggable: false,
                rowStyle: {borderBottom: '2px solid lightgray'}
            }}
            actions={[
                {
                    icon: 'filter_list',
                    tooltip: 'Zobraz/Skry filter',
                    onClick: () => {
                        setShowFilter(!showFilter)
                    },
                    isFreeAction: true
                }, ...actions,
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
        />)
}

export default MaterialTableCustom;