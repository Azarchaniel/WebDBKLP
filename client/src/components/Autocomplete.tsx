import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    KeyboardEvent,
    ChangeEvent,
    useMemo,
} from 'react';
import "../styles/Autocomplete.scss";

interface Option {
    [key: string]: any;
}

interface MultiselectInputProps {
    value: Option[];
    displayValue: string;
    placeholder?: string;
    onChange: (data: { name: string; value: Option[] }) => void;
    name: string;
    id?: string;
    selectionLimit?: number;
    emptyRecordMsg?: string;
    customerror?: boolean;
    onSearch: (query: string, page: number) => Promise<Option[]>;
    reset?: boolean;
    hasMore?: boolean;
    loading?: boolean;
    pageSize?: number;
    createNew?: (query: string) => void;
}

export const LazyLoadMultiselect = React.memo(({
                                                   value,
                                                   displayValue,
                                                   placeholder = "Vyhľadaj...",
                                                   onChange,
                                                   name,
                                                   id,
                                                   selectionLimit,
                                                   emptyRecordMsg = "Žiaden záznam nenájdený",
                                                   customerror,
                                                   onSearch,
                                                   reset,
                                                   hasMore = false,
                                                   loading = false,
                                                   createNew,
                                               }: MultiselectInputProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedValues, setSelectedValues] = useState<Option[]>(value || []);
    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle reset
    useEffect(() => {
        if (reset) {
            setSelectedValues([]);
            onChange({name, value: []});
            setFilteredOptions([]);
            setCurrentPage(1);
            setSearchQuery("");
            setInputValue("");
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

    const debouncedSearch = useMemo(() =>
            debounce(async (query: string, page: number) => {
                const newOptions = await onSearch(query, page);
                setFilteredOptions((prevOptions) => {
                    if (page === 1) {
                        return newOptions;
                    } else {
                        return [...prevOptions, ...newOptions];
                    }
                });
            }, 300),
        [onSearch, debounce]
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
        if (loading || !hasMore) return;
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        debouncedSearch(searchQuery, nextPage);
    }, [currentPage, debouncedSearch, hasMore, loading, searchQuery]);

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
        if (createNew && searchQuery) {
            createNew(searchQuery);
            setIsOpen(false);
            // setInputValue("");
            // setSearchQuery("");
        }
    }, [createNew, searchQuery]);

    return (
        <div
            ref={wrapperRef}
            id={id}
            className={`chip-multiselect ${customerror ? 'error' : ''}`}
        >
            <div className="chip-container">
                {selectedValues.map((item, index) => (
                    <div key={index} className="chip">
                        {item[displayValue]}
                        <span
                            className="chip-remove"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item);
                            }}
                        >
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
                <div className="autocomplete-menu">
                    {filteredOptionsToDisplay.length === 0 && !loading && searchQuery.length > 0 ? (
                        <>
                            <div className="autocomplete-item empty">{emptyRecordMsg}</div>
                            {createNew && (
                                <div className="autocomplete-item create-new" onClick={handleCreateNew}>
                                    Vytvoriť "{searchQuery}"
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {filteredOptionsToDisplay.map((option, index) => (
                                <div
                                    key={index}
                                    className="autocomplete-item"
                                    onClick={() => handleSelect(option)}
                                >
                                    {option[displayValue]}
                                </div>
                            ))}
                            {loading && (
                                <div className="autocomplete-item loading">Načítava sa...</div>
                            )}
                            {hasMore && !loading && (
                                <div
                                    className="autocomplete-item load-more"
                                    onClick={loadMoreOptions}
                                >
                                    Načítať ďalšie...
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
});