import React, {ReactElement, useEffect, useState} from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    ColumnDef,
    flexRender,
} from '@tanstack/react-table';
import {LoadingBooks} from "./LoadingBooks";

type PropsMT = {
    title: string;
    data: any[];
    columns: ColumnDef<any>[];
    pageChange: (page: number) => void;
    pageSizeChange: (pageSize: number) => void;
    totalCount: number;
    actions?: ReactElement;
    detailPanel?: any;
    loading?: boolean;
    pagination?: {
        page: number;
        pageSize: number;
    };
    hiddenCols?: { [columnId: string]: boolean };
};

const ServerPaginationTable: React.FC<PropsMT> =
    ({
         title,
         data,
         columns,
         actions,
         pageChange,
         pageSizeChange,
         totalCount,
         loading = false,
         pagination = {page: 1, pageSize: 50},
         hiddenCols,
     }) => {
        const [currentPage, setCurrentPage] = useState(pagination.page);
        const [currentPageSize, setCurrentPageSize] = useState(pagination.pageSize);

        const maxPage = Math.ceil(totalCount / currentPageSize);

        useEffect(() => {
            console.log(hiddenCols)
        }, [hiddenCols]);

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
            },
            getCoreRowModel: getCoreRowModel(),
            getPaginationRowModel: getPaginationRowModel(),
            manualPagination: true
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
                        <table style={{color: "black", width: "100%"}}>
                            <thead className="tableHeader">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} colSpan={header.colSpan} className="p-2">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                            </thead>
                            <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="p-2">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
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
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
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
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
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
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
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
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m7 18 6-6-6-6"/>
                            <path d="M17 6v12"/>
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

export default ServerPaginationTable;
