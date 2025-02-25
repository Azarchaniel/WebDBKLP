import React, {ReactElement, useEffect, useState} from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    ColumnDef,
    flexRender, SortingState, getExpandedRowModel, ExpandedState,
} from '@tanstack/react-table';
import {LoadingBooks} from "./LoadingBooks";
import BookDetail from "../pages/books/BookDetail";

type PropsMT = {
    title: string;
    data: any[];
    columns: ColumnDef<any>[];
    pageChange: (page: number) => void;
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
    };
    hiddenCols?: { [columnId: string]: boolean };
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
         pagination = {page: 1, pageSize: 50, sorting: {id: "", desc: true}},
         hiddenCols
     }) => {
        const [currentPage, setCurrentPage] = useState(pagination.page);
        const [currentPageSize, setCurrentPageSize] = useState(pagination.pageSize);
        const [sorting, setSorting] = React.useState<SortingState>([])
        const [expanded, setExpanded] = useState<ExpandedState>({});

        const maxPage = Math.ceil(totalCount / currentPageSize);

        useEffect(() => {
            setCurrentPage(pagination.page);
            setCurrentPageSize(pagination.pageSize);
        }, [pagination]);

        useEffect(() => {
            sortingChange(sorting);
        }, [sorting]);

        useEffect(() => {
            pageChange(currentPage);
        }, [currentPage]);

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
                        <table className="serverPaginationTable" style={{color: "black", width: "100%"}}>
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
                                    <th></th>
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
                                            <td colSpan={row.getAllCells().length} style={{pointerEvents: "none"}}>
                                                <BookDetail data={row.original} />
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* FOOTER / PAGINATION */}

                <div className="row tableNavigationRow">
                    <div>
                        <span style={{marginRight: "1rem"}}>Záznamov na stranu: </span>
                        <select
                            style={{marginRight: "2rem"}}
                            value={currentPageSize}
                            onChange={(e) => setCurrentPageSize(Number(e.target.value))}
                        >
                            {[10, 20, 50, 100].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="tabNav first"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage <= 1}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="lucide lucide-chevron-first">
                            <path d="m17 18-6-6 6-6"/>
                            <path d="M7 6v12"/>
                        </svg>
                    </button>
                    <button
                        className="tabNav previous"
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        disabled={currentPage <= 1}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="lucide lucide-chevron-left">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <span className="pageSelector"
                          onClick={() => setCurrentPage(currentPage - 2)}>{currentPage > 2 ? currentPage - 2 : null}</span>
                    <span className="pageSelector"
                          onClick={() => setCurrentPage(currentPage - 1)}>{currentPage > 1 ? currentPage - 1 : null}</span>
                    <span className="pageSelector current">{currentPage}</span>
                    <span className="pageSelector"
                          onClick={() => setCurrentPage(currentPage + 1)}>{(currentPage + 1) <= maxPage ? currentPage + 1 : null}</span>
                    <span className="pageSelector"
                          onClick={() => setCurrentPage(currentPage + 2)}>{(currentPage + 2) <= maxPage ? currentPage + 2 : null}</span>
                    <button
                        className="tabNav next"
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={currentPage >= maxPage}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="lucide lucide-chevron-right">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </button>
                    <button
                        className="tabNav last"
                        onClick={() => setCurrentPage(maxPage)}
                        disabled={currentPage >= maxPage}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m7 18 6-6-6-6"/>
                            <path d="M17 6v12"/>
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

export default ServerPaginationTable;
