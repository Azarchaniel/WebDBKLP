import React, {ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";

type OptionValue = string | { [key: string]: any };

interface Option {
    [key: string]: any;
}

type LoadingStatus = "idle" | "loading" | "hasMore" | "noMore";

interface AutocompleteInputProps {
    value: OptionValue[];
    displayValue?: string; // Now optional since it's not needed for string arrays
    placeholder?: string;
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
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>("idle");
    const menuRef = useRef<HTMLDivElement>(null);
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

    const handleSelect = useCallback((option: OptionValue) => {
        if (disabled) return;
        let newSelectedValues;

        if (selectionLimit && selectedValues.length >= selectionLimit) {
            return;
        }

        if (selectedValues.some(item => areOptionsEqual(item, option))) {
            newSelectedValues = selectedValues.filter(item => !areOptionsEqual(item, option));
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
    }, [selectedValues, onChange, name, selectionLimit, areOptionsEqual, disabled]);

    const handleRemove = useCallback((option: OptionValue) => {
        if (disabled) return;
        const newSelectedValues = selectedValues.filter(item => !areOptionsEqual(item, option));
        setSelectedValues(newSelectedValues);
        onChange({name, value: newSelectedValues});
        if (inputRef.current) inputRef.current.focus();
    }, [selectedValues, onChange, name, areOptionsEqual, disabled]);

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
                const filtered = options.filter(option => {
                    const text = getDisplayText(option)?.toLowerCase();
                    return text?.includes(query?.toLowerCase());
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
        <div style={{position: "relative"}}>
            {placeholder && <span
                className={`autocomplete-label ${
                    inputValue || selectedValues.length > 0 || isInputFocused ? "active" : ""
                } ${disabled ? "disabled" : ""}`}
            >
                {placeholder}
            </span>}
            <div
                ref={wrapperRef}
                id={id}
                className={`chip-multiselect ${customerror ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
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
                {isOpen && !disabled && (
                    <div
                        ref={menuRef}
                        className={`autocomplete-menu ${dropdownPosition === 'top' ? 'top' : ''}`}
                        style={{...dropdownStyle, position: "fixed"}}
                    >
                        {/* no data */}
                        {filteredOptionsToDisplay.length === 0 && (
                            <div className="autocomplete-item empty">
                                {emptyRecordMsg}
                            </div>
                        )}
                        {/* create new */}
                        {filteredOptionsToDisplay.length === 0 && searchQuery.length > 0 && onNew && (
                            <div className="autocomplete-item create-new" onClick={handleCreateNew}
                                 title="`Meno Priezvisko` alebo `Priezvisko, Meno` alebo `Priezvisko`">
                                Vytvoriť "{searchQuery}"
                            </div>
                        )}
                        {/* data and loading more */}
                        {filteredOptionsToDisplay.length > 0 && (
                            <>
                                {filteredOptionsToDisplay.map((option, index) => (
                                    <div
                                        key={index}
                                        className={`autocomplete-item ${selectionLimit && selectedValues?.length >= selectionLimit ? 'disabled' : ''}`}
                                        onClick={disabled ? undefined : () => handleSelect(option)}
                                    >
                                        {getDisplayText(option)}
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
        </div>
    );
});