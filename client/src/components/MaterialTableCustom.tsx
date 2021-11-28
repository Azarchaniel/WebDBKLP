import React from "react";
import MaterialTable, {Column} from "material-table";

type PropsMT = {
    title: string,
    data: any[],
    columns: Column<any>[],
    actions: any[],
}

const MaterialTableCustom: React.FC<PropsMT> = ({title, data, columns, actions}: PropsMT) => {

    return (
        <MaterialTable
            title={title}
            columns={columns}
            data={data}
            options={{
                filtering: true,
                actionsColumnIndex: -1,
                pageSize: 20,
                paginationType: "stepped",
                draggable: false
            }}
            actions={actions}
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
        />)
}

export default MaterialTableCustom;