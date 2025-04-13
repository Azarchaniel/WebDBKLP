import React, {
    ChangeEvent,
    KeyboardEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import "@styles/Autocomplete.scss";






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
            onChange({name, value: newChips});
            setInputValue("");
        } else if (event.key === "Backspace" && inputValue === "" && chips.length > 0) {
            event.preventDefault();
            const newChips = chips.slice(0, -1);
            setChips(newChips);
            onChange({name, value: newChips});
        }
    };

    const handleRemoveChip = useCallback((chipToRemove: string) => {
        const newChips = chips.filter((chip) => chip !== chipToRemove);
        setChips(newChips);
        onChange({name, value: newChips});
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [chips, onChange]);

    return (
        <div className={`chip-multiselect ${className || ""}`}>
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
                    placeholder={chips.length === 0 ? placeholder : ""}
                    className="chip-input"
                />
            </div>
        </div>
    );
});