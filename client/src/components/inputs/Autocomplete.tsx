import React, { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@styles/Autocomplete.scss";

type OptionValue = string | { [key: string]: any };

type LoadingStatus = "idle" | "loading" | "hasMore" | "noMore";

interface AutocompleteInputProps {
    value: OptionValue[];
    displayValue?: string; // Now optional since it's not needed for string arrays
    placeholder?: string;
    hoverLabel?: string; // Tooltip label shown on input hover
    onChange: (data: { name: string; value: OptionValue[] }) => void;
    name: string;
    id?: string;
    selectionLimit?: number;
    emptyRecordMsg?: string;
    customerror?: boolean;
    onSearch?: (query: string, page: number, ids?: string[]) => Promise<OptionValue[]>;
    reset?: boolean;
    onNew?: (query: string) => void;
    options?: OptionValue[]; // Can be string[] or Option[]
    disabled?: boolean; // New prop to disable the input
}

/**
 ** AUTOCOMPLETE/MULTISELECT component
 *
 * Usage with objects:
 *                             <LazyLoadMultiselect
 *                                 value={selectedBooks}
 *                                 displayValue="title"
 *                                 placeholder="Vyhľadaj knihu..."
 *                                 onChange={handleBookChange}
 *                                 name="books"
 *                                 onSearch={handleSearch}
 *                                 onNew={(neww) => console.log("creating new item", neww)}
 *                             />
 *
 * Usage with strings:
 *                             <LazyLoadMultiselect
 *                                 value={selectedTags}
 *                                 placeholder="Vyhľadaj tag..."
 *                                 onChange={handleTagChange}
 *                                 name="tags"
 *                                 options={availableTags}
 *                             />
 */

export const LazyLoadMultiselect = React.memo(({
    value,
    displayValue = "name", // Default to "name" if not provided
    placeholder = "Vyhľadaj...",
    hoverLabel = "Vyber položku zo zoznamu, alebo napíš a potvrď Enterom.",
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
    disabled = false, // Default to false
}: AutocompleteInputProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedValues, setSelectedValues] = useState<OptionValue[]>(value || []);
    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<OptionValue[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>("idle");
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [isInputFocused, setIsInputFocused] = useState(false); // Track input focus

    const handleInputFocus = useCallback(() => {
        if (disabled) return;
        setIsInputFocused(true);
    }, [disabled]);

    const handleInputBlur = useCallback(() => {
        if (disabled) return;
        setIsInputFocused(false);
    }, [disabled]);

    useEffect(() => {
        if (options.some(option => typeof option === 'object' && option !== null && !(displayValue in option))) {
            throw new Error("`displayValue` is required in every object in the `options` array.");
        }
    }, [options, displayValue]);

    // Helper function to get display text for an option (string or object)
    const getDisplayText = useCallback((option: OptionValue): string => {
        if (typeof option === 'string') {
            return option;
        } else {
            return option[displayValue];
        }
    }, [displayValue]);

    // Helper function to compare options for equality
    const areOptionsEqual = useCallback((option1: OptionValue, option2: OptionValue): boolean => {
        if (typeof option1 === 'string' && typeof option2 === 'string') {
            return option1 === option2;
        } else if (typeof option1 === 'object' && option1 !== null &&
            typeof option2 === 'object' && option2 !== null) {
            return option1[displayValue] === option2[displayValue];
        }
        return false;
    }, [displayValue]);

    // Handle reset
    useEffect(() => {
        if (reset) {
            setSelectedValues([]);
            onChange({ name, value: [] });
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
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node) && (!menuRef.current || !menuRef.current.contains(event.target as Node))) {
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

    const handleSelect = useCallback((option: OptionValue) => {
        if (disabled) return;
        let newSelectedValues;

        // Allow toggling off even when selection limit is reached; only block adding new beyond the limit
        if (selectionLimit && selectedValues.length >= selectionLimit && !selectedValues.some(item => areOptionsEqual(item, option))) {
            return;
        }

        if (selectedValues.some(item => areOptionsEqual(item, option))) {
            newSelectedValues = selectedValues.filter(item => !areOptionsEqual(item, option));
        } else {
            newSelectedValues = [...selectedValues, option];
        }

        setSelectedValues(newSelectedValues);
        onChange({ name, value: newSelectedValues });
        setInputValue('');
        setSearchQuery('');
        setFilteredOptions([]);
        setCurrentPage(1);
        setIsOpen(false);
        if (inputRef.current) inputRef.current.focus();
    }, [selectedValues, onChange, name, selectionLimit, areOptionsEqual, disabled]);

    const handleRemove = useCallback((option: OptionValue) => {
        if (disabled) return;
        const newSelectedValues = selectedValues.filter(item => !areOptionsEqual(item, option));
        setSelectedValues(newSelectedValues);
        onChange({ name, value: newSelectedValues });
        if (inputRef.current) inputRef.current.focus();
    }, [selectedValues, onChange, name, areOptionsEqual, disabled]);

    const debouncedSearch = useCallback(
        debounce(async (query: string, page: number) => {
            if (onSearch) {
                setLoadingStatus("loading"); // Start loading
                const newOptionsRaw = await onSearch(query, page);
                // Filter out empty options (empty strings or empty display values)
                const newOptions = newOptionsRaw.filter((option) => {
                    const text = getDisplayText(option);
                    return !!text && text.trim().length > 0;
                });
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
                const filtered = options.filter(option => {
                    const text = getDisplayText(option);
                    if (!text || text.trim().length === 0) return false; // filter empty options
                    return text.toLowerCase().includes(query.toLowerCase());
                });
                setFilteredOptions(filtered);
                setLoadingStatus("noMore"); // No more items to load
            }
        }, 300),
        [onSearch, options, getDisplayText]
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const value = e.target.value;
        setInputValue(value);
        setSearchQuery(value);
        setCurrentPage(1);
        debouncedSearch(value, 1);
        if (!isOpen) setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
            // Remove last chip when backspace is pressed on empty input
            handleRemove(selectedValues[selectedValues.length - 1]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'Enter') {
            // On Enter: select first option if available, otherwise create new when allowed
            e.preventDefault();
            if (filteredOptionsToDisplay.length > 0) {
                handleSelect(filteredOptionsToDisplay[0]);
            } else if (onNew && inputValue.trim().length > 0) {
                handleCreateNew();
            }
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
            !selectedValues.some(selected => areOptionsEqual(selected, option))
        );
    }, [filteredOptions, selectedValues, areOptionsEqual]);

    const handleInputClick = useCallback(() => {
        if (disabled) return;
        setIsOpen(true);
        if (inputRef.current) inputRef.current.focus();
        if (inputValue === "") {
            debouncedSearch("", 1);
        }
    }, [inputValue, debouncedSearch, disabled]);

    const handleCreateNew = useCallback(() => {
        if (disabled) return;
        if (onNew && searchQuery) {
            onNew(searchQuery);
            setIsOpen(false);
            setInputValue("");
            setSearchQuery("");
        }
    }, [onNew, searchQuery, disabled]);


    // Position dropdown using input's bounding rect, for portal rendering
    const adjustDropdownPosition = useCallback(() => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const spaceBelow = windowHeight - rect.bottom;
            const spaceAbove = rect.top;
            const newStyle: React.CSSProperties = {
                position: 'absolute',
                width: rect.width,
                left: rect.left,
                zIndex: 9999,
            };
            if (spaceBelow < 200 && spaceAbove > 200) { // 200px is approx menu height
                setDropdownPosition('top');
                newStyle.top = rect.top - 200; // show above
            } else {
                setDropdownPosition('bottom');
                newStyle.top = rect.bottom; // show below
            }
            setDropdownStyle(newStyle);
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (loadingStatus === "hasMore" && menuRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = menuRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20) { // 20px threshold
                loadMoreOptions();
            }
        }
    }, [loadingStatus, loadMoreOptions]);


    useEffect(() => {
        if (isOpen) {
            adjustDropdownPosition();
        }
    }, [isOpen, adjustDropdownPosition]);

    useEffect(() => {
        if (isOpen && menuRef.current) {
            menuRef.current.addEventListener('scroll', handleScroll as any);
            return () => menuRef?.current?.removeEventListener('scroll', handleScroll as any);
        }
    }, [isOpen, handleScroll]);

    return (
        <div style={{ position: "relative" }}>
            {placeholder && <span
                className={`autocomplete-label ${inputValue || selectedValues.length > 0 || isInputFocused ? "active" : ""
                    } ${disabled ? "disabled" : ""}`}
            >
                {placeholder}
            </span>}
            <div
                ref={wrapperRef}
                id={id}
                className={`chip-multiselect ${customerror ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
                style={{ position: "relative" }}
            >
                <div className="input-wrapper">
                    <div className="chip-container">
                        {Array.isArray(selectedValues) && selectedValues.length > 0 && selectedValues.map((item, index) => (
                            <div
                                key={index}
                                className={`chip${disabled ? ' disabled' : ''}`}
                                onClick={disabled ? undefined : (e) => {
                                    e.stopPropagation();
                                    handleRemove(item);
                                }}
                            >
                                <span>
                                    {getDisplayText(item)}
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
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder=""
                            title={hoverLabel}
                            aria-label={hoverLabel}
                            className="chip-input"
                            onClick={handleInputClick}
                            disabled={disabled}
                            tabIndex={disabled ? -1 : 0}
                        />
                    </div>
                    <div className="chip-dropdown-indicator" onClick={disabled ? undefined : handleInputClick}>
                        <i className={`fa fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
                    </div>
                </div>
                {isOpen && !disabled &&
                    createPortal(
                        <div
                            ref={menuRef}
                            className={`autocomplete-menu ${dropdownPosition === 'top' ? 'top' : ''}`}
                            style={{
                                ...dropdownStyle,
                                borderRadius: dropdownPosition === 'bottom' ? "0 0 8px 8px" : "8px 8px 0 0",
                                minWidth: dropdownStyle.width,
                            }}
                        >
                            {/* no data */}
                            {filteredOptionsToDisplay.length === 0 && (
                                <div className="autocomplete-item empty">
                                    {emptyRecordMsg}
                                </div>
                            )}
                            {/* data and loading more */}
                            {filteredOptionsToDisplay.length > 0 && (
                                <>
                                    {filteredOptionsToDisplay.map((option, index) => (
                                        <div
                                            key={index}
                                            className={`autocomplete-item ${selectionLimit && selectedValues?.length >= selectionLimit ? 'disabled' : ''}`}
                                            onMouseDown={disabled ? undefined : (e) => { e.preventDefault(); handleSelect(option); }}
                                        >
                                            {getDisplayText(option)}
                                        </div>
                                    ))}
                                    {loadingStatus === "loading" && (
                                        <div className="autocomplete-item loading">Načítava sa...</div>
                                    )}
                                </>
                            )}
                            {/* create new */}
                            {searchQuery.length > 0 && onNew && (
                                <div className="autocomplete-item create-new" onClick={handleCreateNew}
                                    title="`Meno Priezvisko` alebo `Priezvisko, Meno` alebo `Priezvisko`">
                                    Vytvoriť "{searchQuery}"
                                </div>
                            )}
                        </div>, document.body
                    )
                }
            </div>
        </div>
    );
});
