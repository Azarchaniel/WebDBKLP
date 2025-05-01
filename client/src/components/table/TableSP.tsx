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
import "@styles/table.scss";
import {getUniqueFieldValues} from "../../API";
import {mapBookColumnsToFilterTypes, mapColumnName} from "@utils";
import {LazyLoadMultiselect} from "@components/inputs";

type PropsMT = {
    title: string;
    data: any[];
    columns: ColumnDef<any>[];
    pageChange: (page: number) => void;
    pageSizeChange: (pageSize: number) => void;
    sortingChange: (sorting: SortingState) => void;
    filteringChange?: (filters: any[]) => void;
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
         filteringChange,
         totalCount,
         loading = false,
         pagination = {page: 1, pageSize: 50, sorting: [{id: "", desc: true}]},
         hiddenCols,
         expandedElement
     }) => {
        const [currentPage, setCurrentPage] = useState(pagination.page);
        const [currentPageSize, setCurrentPageSize] = useState(pagination.pageSize);
        const [sorting, setSorting] = React.useState<SortingState>(pagination.sorting)
        const [expanded, setExpanded] = useState<ExpandedState>({});
        const [filtering, setFiltering] = useState([]);
        const [dataForFilterInputs, setDataForFilterInputs] = useState(null);
        const [showFilters, setShowFilters] = useState(false);
        const [numberFilterStates, setNumberFilterStates] = useState<Record<string, {value: string, operator: string}>>({});

        const maxPage = Math.ceil(totalCount / currentPageSize);

        useEffect(() => {
            setCurrentPage(pagination.page);
            setCurrentPageSize(pagination.pageSize);
            setSorting(pagination.sorting);
            setExpanded({});
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

        useEffect(() => {
            if (filteringChange) {
                // Map any object values to just their _id before sending to the parent component
                const processedFilters = filtering?.map((filter: { id: string, value: any, operator?: string }) => {
                    // Process the value based on its type
                    let processedFilter = {...filter};

                    if (filter.value && typeof filter.value === 'object') {
                        // If value is an array of objects with _id
                        if (Array.isArray(filter.value) && filter.value[0] && (filter.value[0] as any)._id) {
                            processedFilter = {
                                ...filter,
                                value: (filter.value as any[]).map((item: any) => item._id)
                            };
                        }
                        // If value is a single object with _id
                        else if ((filter.value as any)._id) {
                            processedFilter = {
                                ...filter,
                                value: (filter.value as any)._id
                            };
                        }
                    }

                    // Map column ID to the backend field name
                    return {
                        ...processedFilter,
                        id: mapColumnName(filter.id)
                    };
                });

                filteringChange(processedFilters);
            }
        }, [filtering]);

        useEffect(() => {
            let mounted = true;

            async function fetchDataForInputs() {
                try {
                    const result = await getUniqueFieldValues();
                    if (mounted) {
                        // Use state to store the fetched data
                        setDataForFilterInputs(result.data as any);
                    }
                } catch (error) {
                    console.error('Failed to fetch filter data:', error);
                }
            }

            if (filteringChange) {
                fetchDataForInputs();
            }

            return () => {
                mounted = false;
            };
        }, [filtering]);

        const getInputForColumn = (columnName: string) => {
            switch (mapBookColumnsToFilterTypes(columnName)) {
                case "input":
                    return (
                        <input
                            className="form-control"
                            type="text"
                            value={(filtering as any[]).find((f) => f.id === columnName)?.value || ''}
                            onChange={(e) => {
                                const value = e.target.value;

                                setFiltering((prev: any) => {
                                    const existingFilter = prev.find((f: any) => f.id === columnName);
                                    if (existingFilter) {
                                        if (value === '') {
                                            return prev.filter((f: any) => f.id !== columnName);
                                        } else {
                                            return prev.map((f: any) =>
                                                f.id === columnName ? {...f, value} : f
                                            );
                                        }
                                    } else {
                                        return [...prev, {id: columnName, value}];
                                    }
                                });
                            }}
                        />
                    );
                case "select":
                    return (
                        <LazyLoadMultiselect
                            value={(filtering as any[]).find((f) => f.id === columnName)?.value || ''}
                            onChange={(e) => {
                                const value = e.value;
                                setFiltering((prev: any) => {
                                    const existingFilter = prev.find((f: any) => f.id === columnName);
                                    if (existingFilter) {
                                        if (!value) {
                                            return prev.filter((f: any) => f.id !== columnName);
                                        } else {
                                            return prev.map((f: any) =>
                                                f.id === columnName ? {...f, value} : f
                                            );
                                        }
                                    } else {
                                        return [...prev, {id: columnName, value: value}];
                                    }
                                });
                            }}
                            name={columnName}
                            displayValue="name"
                            options={dataForFilterInputs?.[mapColumnName(columnName)] || []}
                            placeholder={""}
                        />

                    )
                case "checkbox":
                    return (
                        <select
                            className="form-control"
                            style={{padding: "0"}}
                            value={(filtering as any[]).find((f) => f.id === columnName)?.value || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFiltering((prev: any) => {
                                    const existingFilter = prev.find((f: any) => f.id === columnName);
                                    if (existingFilter) {
                                        if (value === '') {
                                            return prev.filter((f: any) => f.id !== columnName);
                                        } else {
                                            return prev.map((f: any) =>
                                                f.id === columnName ? {...f, value: value} : f
                                            );
                                        }
                                    } else {
                                        return [...prev, {id: columnName, value: value}];
                                    }
                                });
                            }}
                        >
                            <option value=""></option>
                            <option value="Y">Áno</option>
                            <option value="N">Nie</option>
                        </select>
                    );
                case "number":
                    const numFilter = (filtering as any[]).find((f) => f.id === columnName);
                    const numValue = numFilter?.value || '';
                    const numOperator = numFilter?.operator || '=';

                    const currentNumFilter = numberFilterStates[columnName] || {value: numValue, operator: numOperator};

                    const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                        const operator = e.target.value;
                        const value = currentNumFilter.value;

                        // Update local state
                        setNumberFilterStates(prev => ({
                            ...prev,
                            [columnName]: {value, operator}
                        }));

                        // Only update filter if both are set
                        if (value) {
                            setFiltering((prev: any) => {
                                const existingFilter = prev.find((f: any) => f.id === columnName);
                                if (existingFilter) {
                                    return prev.map((f: any) =>
                                        f.id === columnName ? {...f, value, operator} : f
                                    );
                                } else {
                                    return [...prev, {id: columnName, value, operator}];
                                }
                            });
                        }
                    };

                    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        const operator = currentNumFilter.operator;

                        // Update local state
                        setNumberFilterStates(prev => ({
                            ...prev,
                            [columnName]: {value, operator}
                        }));

                        // Handle filter update based on value
                        if (value === '') {
                            setFiltering((prev: any) => prev.filter((f: any) => f.id !== columnName));
                        } else if (operator) {
                            setFiltering((prev: any) => {
                                const existingFilter = prev.find((f: any) => f.id === columnName);
                                if (existingFilter) {
                                    return prev.map((f: any) =>
                                        f.id === columnName ? {...f, value, operator} : f
                                    );
                                } else {
                                    return [...prev, {id: columnName, value, operator}];
                                }
                            });
                        }
                    };

                    return (
                        <div className="d-flex number-filter">
                            <select
                                className="form-control operator-select"
                                value={currentNumFilter.operator}
                                onChange={handleOperatorChange}
                                style={{width: "40px", flex: "0 0 auto", padding: "0 4px"}}
                                title="Zvoľte operátor porovnania"
                            >
                                <option value="=" title="má rovnako">=</option>
                                <option value="<" title="má menej než">{"<"}</option>
                                <option value=">" title="má viac než">{">"}</option>
                            </select>
                            <input
                                className="form-control"
                                type="number"
                                value={currentNumFilter.value}
                                onChange={handleValueChange}
                                placeholder="Vyhľadaj..."
                                style={{flex: "1 1 auto"}}
                            />
                        </div>
                    );
                default:
                    return null;
            }
        };

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
                expanded: expanded,
                columnFilters: filtering
            },
            getCoreRowModel: getCoreRowModel(),
            getPaginationRowModel: getPaginationRowModel(),
            manualPagination: true,
            onSortingChange: setSorting,
            onExpandedChange: setExpanded,
            onColumnFiltersChange: (val: any) => setFiltering(val), // Update filtering state
            getRowCanExpand: () => true, //all rows can expand
            getExpandedRowModel: getExpandedRowModel(),
            manualFiltering: true
        });

        return (
            <div className="p-4">
                <div className="headerTitleAction">
                    <h4 className="ml-4 mb-3" style={{color: "black"}}>{title}</h4>
                    <div className="row">
                        {actions}
                        {filteringChange &&
                            <button
                                className="filtersBtn"
                                onClick={() => {
                                    setShowFilters(!showFilters);
                                    if (showFilters) {
                                        setFiltering([]);
                                    }
                                }}
                            >
                                <i className="fas fa-filter" title="Filtre"/>
                            </button>}
                    </div>
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
                                {table.getHeaderGroups().map((headerGroup, index) => (
                                    <React.Fragment key={headerGroup.id}>
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <th key={`${headerGroup.id}-${header.id}`} colSpan={header.colSpan}
                                                    className={`TSP${header.column.id} ${showFilters ? "filter-header" : ""}`}>
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
                                            <th key={`${headerGroup.id}-actions`} className="TSPactionsRow"/>
                                        </tr>
                                        {showFilters && index === table.getHeaderGroups().length - 1 && (
                                            <tr key={headerGroup.id + "-filter"} className="filter-header">
                                                {headerGroup.headers.map((header) => (
                                                    <th key={`${headerGroup.id}-${header.id}-filter`}>
                                                        {header.column.getCanFilter() && (
                                                            getInputForColumn(header.column.id)
                                                        )}
                                                    </th>
                                                ))}
                                                <th key={`${headerGroup.id}-actions-filter`}></th>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                </thead>

                                <tbody style={{pointerEvents: "none"}}>
                                    {table.getRowModel().rows.map((row) => (
                                        <React.Fragment key={row.original._id}>
                                            <tr key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={`${row.id}-${cell.id}`} className={"TSP" + cell.column.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                                {rowActions &&
                                                    <td key={`${row.id}-actions`} className="TSPactionsRow">
                                                        {rowActions(row.original._id, () => row.toggleExpanded())}
                                                    </td>
                                                }
                                            </tr>
                                            {row.getIsExpanded() && (
                                                <tr key={`${row.id}-expanded`} style={{pointerEvents: "none"}}>
                                                    {/* +1 is because of Actions column */}
                                                    <td colSpan={row.getAllCells().length + 1}
                                                        style={{pointerEvents: "none"}}>
                                                        {expandedElement && expandedElement(row.original)}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            {data.length === 0 && (
                                <div className="no-data">
                                    Žiadne dáta
                                </div>
                            )}
                            <Pagination
                                key={`pagination-${currentPage}-${currentPageSize}`}
                                currentPage={currentPage}
                                pageSize={currentPageSize}
                                totalPages={maxPage}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
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
