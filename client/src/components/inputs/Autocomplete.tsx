import React, {ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";

interface Option {
    [key: string]: any;
}

type LoadingStatus = "idle" | "loading" | "hasMore" | "noMore";

interface AutocompleteInputProps {
    value: Option[];
    displayValue: string;
    placeholder?: string;
    onChange: (data: { name: string; value: Option[] }) => void;
    name: string;
    id?: string;
    selectionLimit?: number;
    emptyRecordMsg?: string;
    customerror?: boolean;
    onSearch?: (query: string, page: number, ids?: string[]) => Promise<Option[]>; // Now optional
    reset?: boolean;
    onNew?: (query: string) => void;
    options?: Option[]; // New optional prop for finite data
}

/**
 ** AUTOCOMPLETE/MULTISELECT component
 *
 * Usage:
 *                             <LazyLoadMultiselect
 *                                 value={selectedBooks}
 *                                 displayValue="title"
 *                                 placeholder="Vyhľadaj knihu..."
 *                                 onChange={handleBookChange}
 *                                 name="books"
 *                                 onSearch={handleSearch}
 *                                 hasMore={hasMore}
 *                                 loading={acLoading}
 *                                 onNew={(neww) => console.log("creating new item", neww)}
 *                             />
 */

export const LazyLoadMultiselect = React.memo(({
                                                   value,
                                                   displayValue,
                                                   placeholder = "Vyhľadaj...",
                                                   onChange,
                                                   name,
                                                   id,
                                                   selectionLimit,
                                                   emptyRecordMsg = "Žiaden záznam nenájdený!",
                                                   customerror,
                                                   onSearch,
                                                   reset,
                                                   onNew,
                                                   options = [], // Default to empty array if not provided
                                               }: AutocompleteInputProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedValues, setSelectedValues] = useState<Option[]>(value || []);
    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>("idle"); // New combined state
    const menuRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    // Handle reset
    useEffect(() => {
        if (reset) {
            setSelectedValues([]);
            onChange({name, value: []});
            setFilteredOptions([]);
            setCurrentPage(1);
            setSearchQuery("");
            setInputValue("");
            setLoadingStatus("idle");
        }
    }, [reset, name, onChange]);

    // Update selected values when prop changes
    useEffect(() => {
        setSelectedValues(value || []);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const debounce = useCallback((func: (query: string, page: number) => void, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: [string, number]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    }, []);

    const handleSelect = useCallback((option: Option) => {
        let newSelectedValues;

        if (selectionLimit && selectedValues.length >= selectionLimit) {
            return;
        }

        if (selectedValues.some(item => item[displayValue] === option[displayValue])) {
            newSelectedValues = selectedValues.filter(item => item[displayValue] !== option[displayValue]);
        } else {
            newSelectedValues = [...selectedValues, option];
        }

        setSelectedValues(newSelectedValues);
        onChange({name, value: newSelectedValues});
        setInputValue('');
        setSearchQuery('');
        setFilteredOptions([]);
        setCurrentPage(1);
        setIsOpen(false);
        if (inputRef.current) inputRef.current.focus();
    }, [selectedValues, displayValue, onChange, name, selectionLimit]);

    const handleRemove = useCallback((option: Option) => {
        const newSelectedValues = selectedValues.filter(item => item[displayValue] !== option[displayValue]);
        setSelectedValues(newSelectedValues);
        onChange({name, value: newSelectedValues});
        if (inputRef.current) inputRef.current.focus();
    }, [selectedValues, displayValue, onChange, name]);

    const debouncedSearch = useCallback(
        debounce(async (query: string, page: number) => {
            if (onSearch) {
                setLoadingStatus("loading"); // Start loading
                const newOptions = await onSearch(query, page);
                setFilteredOptions((prevOptions) => {
                    if (page === 1) {
                        return newOptions;
                    } else {
                        return [...prevOptions, ...newOptions];
                    }
                });
                setLoadingStatus(newOptions.length > 0 ? "hasMore" : "noMore"); // Check if there are more items
            } else {
                // Client-side filtering
                const filtered = options.filter(option =>
                    option[displayValue].toLowerCase().includes(query.toLowerCase())
                );
                setFilteredOptions(filtered);
                setLoadingStatus("noMore"); // No more items to load
            }
        }, 300),
        [onSearch, options, displayValue]
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setSearchQuery(value);
        setCurrentPage(1);
        debouncedSearch(value, 1);
        if (!isOpen) setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
            // Remove last chip when backspace is pressed on empty input
            handleRemove(selectedValues[selectedValues.length - 1]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const loadMoreOptions = useCallback(async () => {
        if (loadingStatus !== "hasMore" || !onSearch) return; // Only load more if hasMore and onSearch is provided
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        await debouncedSearch(searchQuery, nextPage);
    }, [currentPage, debouncedSearch, loadingStatus, searchQuery, onSearch]);

    const filteredOptionsToDisplay = useMemo(() => {
        return filteredOptions.filter(option =>
            !selectedValues.some(selected => selected[displayValue] === option[displayValue])
        );
    }, [filteredOptions, selectedValues, displayValue]);

    const handleInputClick = useCallback(() => {
        setIsOpen(true);
        if (inputRef.current) inputRef.current.focus();
        if (inputValue === "") {
            debouncedSearch("", 1);
        }
    }, [inputValue, debouncedSearch]);

    const handleCreateNew = useCallback(() => {
        if (onNew && searchQuery) {
            onNew(searchQuery);
            setIsOpen(false);
            setInputValue("");
            setSearchQuery("");
        }
    }, [onNew, searchQuery]);

    const adjustDropdownPosition = useCallback(() => {
        if (menuRef.current && wrapperRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            const spaceBelow = windowHeight - wrapperRect.bottom;
            const spaceAbove = wrapperRect.top;

            const newStyle: React.CSSProperties = {
                width: wrapperRect.width,
                left: wrapperRect.left,
            };

            if (spaceBelow < menuRect.height && spaceAbove > menuRect.height) {
                setDropdownPosition('top');
                newStyle.bottom = windowHeight - wrapperRect.top;
            } else {
                setDropdownPosition('bottom');
                newStyle.top = wrapperRect.bottom;
            }
            setDropdownStyle(newStyle);
        }
    }, []);

    const handleScroll = useCallback(
        debounce(() => {
            if (loadingStatus === "hasMore" && menuRef.current) {
                const {scrollTop, scrollHeight, clientHeight} = menuRef.current;
                if (scrollTop + clientHeight >= scrollHeight - 20) { // 20px threshold
                    loadMoreOptions();
                }
            }
        }, 200),
        [loadingStatus, loadMoreOptions]
    );

    useEffect(() => {
        if (isOpen) {
            adjustDropdownPosition();
            window.addEventListener('resize', adjustDropdownPosition);
            window.addEventListener('scroll', adjustDropdownPosition);
        }

        return () => {
            window.removeEventListener('resize', adjustDropdownPosition);
            window.removeEventListener('scroll', adjustDropdownPosition);
        };
    }, [isOpen, adjustDropdownPosition]);

    useEffect(() => {
        if (isOpen && menuRef.current) {
            menuRef.current.addEventListener('scroll', handleScroll as any);
            return () => menuRef?.current?.removeEventListener('scroll', handleScroll as any);
        }
    }, [isOpen, handleScroll]);

    return (
        <div
            ref={wrapperRef}
            id={id}
            className={`chip-multiselect ${customerror ? 'error' : ''}`}
        >
            {/* TODO: show error */}
            <div className="chip-container">
                {Array.isArray(selectedValues) && selectedValues.length > 0 && selectedValues.map((item, index) => (
                    <div
                        key={index}
                        className="chip"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(item);
                        }}
                    >
                        <span>
                            {item[displayValue]}
                        </span>
                        <span className="chip-remove">
                            ×
                        </span>
                    </div>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedValues.length === 0 ? placeholder : ''}
                    className="chip-input"
                    onClick={handleInputClick}
                />
            </div>
            {isOpen && (
                <div
                    ref={menuRef}
                    className={`autocomplete-menu ${dropdownPosition === 'top' ? 'top' : ''}`}
                    style={{...dropdownStyle, position: "fixed"}}
                >
                    {filteredOptionsToDisplay.length === 0 && searchQuery.length > 0 && (
                        <div className="autocomplete-item empty">
                            {emptyRecordMsg}
                        </div>
                    )}
                    {filteredOptionsToDisplay.length === 0 && searchQuery.length > 0 && onNew && (
                        <div className="autocomplete-item create-new" onClick={handleCreateNew}
                             title="`Meno Priezvisko` alebo `Priezvisko, Meno`">
                            Vytvoriť "{searchQuery}"
                        </div>
                    )}
                    {filteredOptionsToDisplay.length > 0 && (
                        <>
                            {filteredOptionsToDisplay.map((option, index) => (
                                <div
                                    key={index}
                                    className={`autocomplete-item ${selectionLimit && selectedValues?.length >= selectionLimit ? 'disabled' : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option[displayValue]}
                                </div>
                            ))}
                            {loadingStatus === "loading" && (
                                <div className="autocomplete-item loading">Načítava sa...</div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
});
