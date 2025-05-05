import React, {
    ChangeEvent,
    KeyboardEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import "@styles/Autocomplete.scss";
import "@styles/ArrayInput.scss"; // Make sure this is imported for floating-label styles

interface ArrayInputProps {
    name: string;
    value: string[];
    onChange: (data: { name: string; value: string[] }) => void;
    placeholder?: string;
    className?: string;
}

export const ArrayInput: React.FC<ArrayInputProps> = React.memo(({
                                                                     name,
                                                                     value,
                                                                     onChange,
                                                                     placeholder = "Pridaj záznam...",
                                                                     className,
                                                                 }) => {
    const [inputValue, setInputValue] = useState("");
    const [chips, setChips] = useState<string[]>(value || []);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setChips(value);
    }, [value]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && inputValue.trim() !== "") {
            event.preventDefault();
            const newChips = [...chips, inputValue.trim()];
            setChips(newChips);
            onChange({ name, value: newChips });
            setInputValue("");
        } else if (event.key === "Backspace" && inputValue === "" && chips.length > 0) {
            event.preventDefault();
            const newChips = chips.slice(0, -1);
            setChips(newChips);
            onChange({ name, value: newChips });
        }
    };

    const handleRemoveChip = useCallback((chipToRemove: string) => {
        const newChips = chips.filter((chip) => chip !== chipToRemove);
        setChips(newChips);
        onChange({ name, value: newChips });
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [chips, onChange]);

    // Determine if label should float
    const shouldFloat = inputValue.length > 0 || chips.length > 0;

    return (
        <div className={`array-input-wrapper ${className || ""}`}>
            <div className="chip-multiselect">
                <div className="chip-container">
                    {chips.map((chip, index) => (
                        <div key={index} className="chip">
                            {chip}
                            <span
                                className="chip-remove"
                                onClick={() => handleRemoveChip(chip)}
                            >
                                ×
                            </span>
                        </div>
                    ))}
                    <input
                        name={name}
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder=""
                        className="chip-input form-control"
                        autoComplete="off"
                        lang="cs-CZ"
                    />
                </div>
            </div>
            <span className={`array-floating-label${shouldFloat ? " float" : ""}`}>{placeholder}</span>
        </div>
    );
});