import React, {ReactElement, useEffect, useState} from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    ColumnDef,
    flexRender, SortingState, getExpandedRowModel, ExpandedState,
} from '@tanstack/react-table';
import {LoadingBooks} from "../LoadingBooks";
import Pagination from "./Pagination";

type PropsMT = {
    title: string;
    data: any[];
    columns: ColumnDef<any>[];
    pageChange: (page: number, letter?: string) => void;
    pageSizeChange: (pageSize: number) => void;
    sortingChange: (sorting: SortingState) => void;
    totalCount: number;
    actions?: ReactElement;
    rowActions?: (_id: string, expandRow: () => void) => ReactElement;
    detailPanel?: any;
    loading?: boolean;
    pagination?: {
        page: number;
        pageSize: number;
        sorting: SortingState;
        search?: string;
        letter?: string;
    };
    hiddenCols?: { [columnId: string]: boolean };
    expandedElement?: (data: any) => ReactElement;
};

const ServerPaginationTable: React.FC<PropsMT> =
    ({
         title,
         data,
         columns,
         actions,
         rowActions,
         pageChange,
         pageSizeChange,
         sortingChange,
         totalCount,
         loading = false,
         pagination = {page: 1, pageSize: 50, sorting: [{id: "", desc: true}], letter: undefined},
         hiddenCols,
         expandedElement
     }) => {
        const [currentPage, setCurrentPage] = useState(pagination.page);
        const [currentPageSize, setCurrentPageSize] = useState(pagination.pageSize);
        const [sorting, setSorting] = React.useState<SortingState>([])
        const [expanded, setExpanded] = useState<ExpandedState>({});
        const [letter, setLetter] = useState<string | undefined>();

        const maxPage = Math.ceil(totalCount / currentPageSize);

        useEffect(() => {
            setCurrentPage(pagination.page);
            setCurrentPageSize(pagination.pageSize);
        }, [pagination]);

        useEffect(() => {
            sortingChange(sorting);
        }, [sorting]);

        useEffect(() => {
            pageChange(currentPage, letter);
        }, [currentPage, letter]);

        useEffect(() => {
            pageSizeChange(currentPageSize);
        }, [currentPageSize]);

        const table = useReactTable({
            data,
            columns,
            pageCount: Math.ceil(totalCount / currentPageSize),
            state: {
                columnVisibility: hiddenCols || {},
                pagination: {
                    pageIndex: currentPage - 1,
                    pageSize: currentPageSize,
                },
                sorting,
                expanded: expanded
            },
            getCoreRowModel: getCoreRowModel(),
            getPaginationRowModel: getPaginationRowModel(),
            manualPagination: true,
            onSortingChange: setSorting,
            onExpandedChange: setExpanded,
            getRowCanExpand: () => true, //all rows can expand
            getExpandedRowModel: getExpandedRowModel(),
        });

        return (
            <div className="p-4">
                <div className="row headerTitleAction">
                    <h4 className="ml-4 mb-3" style={{color: "black"}}>{title}</h4>
                    {actions}
                </div>
                <div>
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <LoadingBooks/>
                        </div>
                    ) : (
                        <>
                        <table className="serverPaginationTable">
                            <thead className="tableHeader">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} colSpan={header.colSpan} className={"TSP" + header.column.id}>
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={
                                                        header.column.getCanSort()
                                                            ? 'cursor-pointer select-none'
                                                            : ''
                                                    }
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    title={
                                                        header.column.getCanSort()
                                                            ? header.column.getNextSortingOrder() === 'asc'
                                                                ? 'Radiť vzostupne'
                                                                : header.column.getNextSortingOrder() === 'desc'
                                                                    ? 'Radiť zostupne'
                                                                    : "Reset"
                                                            : undefined
                                                    }
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {{
                                                        asc: <i className="fa fa-angle-up ml-2"
                                                                style={{fontSize: "24px"}}></i>,
                                                        desc: <i className="fa fa-angle-down ml-2"
                                                                 style={{fontSize: "24px"}}></i>,
                                                    }[header.column.getIsSorted() as string] ?? null}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                    <th className="TSPactionsRow"/>
                                </tr>
                            ))}
                            </thead>

                            <tbody style={{pointerEvents: "none"}}>
                            {table.getRowModel().rows.map((row) => (
                                <>
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className={"TSP" + cell.column.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                        {rowActions &&
                                            <td>
                                                {rowActions(row.original._id, () => row.toggleExpanded())}
                                            </td>
                                        }
                                    </tr>
                                    {row.getIsExpanded() && (
                                        <tr style={{pointerEvents: "none"}}>
                                            {/* +1 is because of Actions column */}
                                            <td colSpan={row.getAllCells().length + 1} style={{pointerEvents: "none"}}>
                                                {expandedElement && expandedElement(row.original)}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            </tbody>
                        </table>
                            <Pagination
                                currentPage={currentPage}
                                pageSize={currentPageSize}
                                totalPages={maxPage}
                                onPageChange={(page, letter) => {
                                    setCurrentPage(page);
                                    setLetter(letter);
                                }}
                                onPageSizeChange={setCurrentPageSize}
                            />
                        </>
                    )}
                </div>
            </div>
        );
    };

export default ServerPaginationTable;
