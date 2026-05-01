import React, { useState, useRef, useEffect, RefObject } from "react";
import { PAGE_SIZE_OPTIONS } from "../../utils/constants";
import { getPageByStartingLetter } from "../../API";
import { IUser } from "../../type";
import { useReadLocalStorage } from "usehooks-ts";
import { useTranslation } from "react-i18next";

type PaginationProps = {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    tableScrollRef?: RefObject<HTMLDivElement>;
    tableRef?: RefObject<HTMLTableElement>;
};

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    pageSize,
    totalPages,
    onPageChange,
    onPageSizeChange,
    tableScrollRef,
    tableRef
}) => {
    const { t } = useTranslation();
    const [inputPage, setInputPage] = useState<string>(currentPage.toString());
    const activeUsers: IUser[] | null = useReadLocalStorage("activeUsers");
    const fakeScrollRef = useRef<HTMLDivElement>(null);
    const fakeInnerRef = useRef<HTMLDivElement>(null);
    const isSyncingRef = useRef(false);

    // Keep fake scrollbar inner width and left offset in sync with the table wrapper
    useEffect(() => {
        const tableEl = tableScrollRef?.current;
        const innerTableEl = tableRef?.current;
        const fakeInner = fakeInnerRef.current;
        const fakeEl = fakeScrollRef.current;
        if (!tableEl || !fakeInner || !fakeEl) return;

        const update = () => {
            fakeInner.style.width = tableEl.scrollWidth + 'px';
            fakeEl.style.left = tableEl.getBoundingClientRect().left + 'px';
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(tableEl);
        if (innerTableEl) ro.observe(innerTableEl);
        return () => ro.disconnect();
    }, [tableScrollRef, tableRef]);

    // Sync scroll positions between table and fake scrollbar
    useEffect(() => {
        const tableEl = tableScrollRef?.current;
        const fakeEl = fakeScrollRef.current;
        if (!tableEl || !fakeEl) return;

        const onTableScroll = () => {
            if (isSyncingRef.current) return;
            isSyncingRef.current = true;
            fakeEl.scrollLeft = tableEl.scrollLeft;
            isSyncingRef.current = false;
        };
        const onFakeScroll = () => {
            if (isSyncingRef.current) return;
            isSyncingRef.current = true;
            tableEl.scrollLeft = fakeEl.scrollLeft;
            isSyncingRef.current = false;
        };
        tableEl.addEventListener('scroll', onTableScroll);
        fakeEl.addEventListener('scroll', onFakeScroll);
        return () => {
            tableEl.removeEventListener('scroll', onTableScroll);
            fakeEl.removeEventListener('scroll', onFakeScroll);
        };
    }, [tableScrollRef]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputPage(value);
    };

    const handleInputBlur = () => {
        const page = parseInt(inputPage);

        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            onPageChange(page);
        } else {
            setInputPage(currentPage.toString());
        }
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleInputBlur();
        }
    };

    const handleLetterChangeKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            const value = (event.target as HTMLInputElement).value.toUpperCase();

            const { data } =
                await getPageByStartingLetter(
                    value,
                    pageSize,
                    window.location.pathname.replace("/", ""),
                    activeUsers?.map(u => u._id)
                );
            onPageChange(data.page);
        }
    };

    return (
        <div className="tableNavigationRow">
            <div ref={fakeScrollRef} className="table-fake-scrollbar">
                <div ref={fakeInnerRef} style={{ height: '1px' }} />
            </div>
            <div className="otherTableControl">
                <span className="pageSelectorLabel">{t("pagination.recordsPerPage")}</span>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    value={inputPage}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="pageInput form-control"
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("pagination.jumpToPage")}
                />
                <input
                    type="text"
                    placeholder="P"
                    maxLength={1}
                    onKeyDown={handleLetterChangeKeyDown}
                    className="pageInput form-control"
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("pagination.jumpToLetter")}
                />
            </div>
            <div className="pageControl">
                <button
                    className=" tabNav first"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage <= 1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="lucide lucide-chevron-first">
                        <path d="m17 18-6-6 6-6" />
                        <path d="M7 6v12" />
                    </svg>
                </button>
                <button
                    className="tabNav previous"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="lucide lucide-chevron-left">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <span className="pageSelector"
                    onClick={() => onPageChange(currentPage - 2)}>{currentPage > 2 ? currentPage - 2 : null}</span>
                <span className="pageSelector"
                    onClick={() => onPageChange(currentPage - 1)}>{currentPage > 1 ? currentPage - 1 : null}</span>
                <span className="pageSelector current">{currentPage}</span>
                <span className="pageSelector"
                    onClick={() => onPageChange(currentPage + 1)}>{(currentPage + 1) <= totalPages ? currentPage + 1 : null}</span>
                <span className="pageSelector"
                    onClick={() => onPageChange(currentPage + 2)}>{(currentPage + 2) <= totalPages ? currentPage + 2 : null}</span>
                <button
                    className="tabNav next"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="lucide lucide-chevron-right">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
                <button
                    className="tabNav last"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m7 18 6-6-6-6" />
                        <path d="M17 6v12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Pagination;