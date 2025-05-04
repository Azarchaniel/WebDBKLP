import React, {useState} from "react";
import "@styles/FromToInput.scss";
import {InputField} from "@components/inputs/Input";

interface FromToInputProps {
    value?: { from?: number; to?: number };
    onChange: (data: { name: string; value: { from?: number; to?: number } }) => void;
    placeholder?: string;
    className?: string;
    name?: string;
}

const FromToInput: React.FC<FromToInputProps> = ({
    value = {},
    onChange,
    placeholder = "Od - Do",
    className = "",
    name = "",
}) => {
    const [inputValue, setInputValue] = useState<string>(
        value.from || value.to ? `${value.from ?? ""} - ${value.to ?? ""}` : ""
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setInputValue(rawValue);

        // Parse the input value into { from, to }
        const [from, to] = rawValue.split("-").map((v) => v.trim());
        const parsedValue = {
            from: from ? parseFloat(from) : undefined,
            to: to ? parseFloat(to) : undefined,
        };

        onChange({ name, value: parsedValue });
    };

    const handleFocus = () => {
        setInputValue(`${value.from ?? ""} - ${value.to ?? ""}`);
    };

    return (
        <div className={`from-to-input ${className}`}>
            <InputField
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                className="form-control"
                onFocus={handleFocus}
            />
        </div>
    );
};

export default React.memo(FromToInput);

