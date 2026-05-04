import React, { useEffect, useRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    customerror?: string;
    ref?: React.Ref<HTMLInputElement>;
    innerClass?: string;
}

export const InputField = React.memo((props: InputProps) => {
    const inputRef = useRef(null);
    const { innerClass, customerror, ...inputProps } = props;
    useEffect(() => {
        if (customerror) {
            if (inputRef.current) {
                (inputRef.current as any).setCustomValidity(customerror);
                (inputRef.current as any).reportValidity();
            }
        } else {
            (inputRef.current as any).setCustomValidity("");
            (inputRef.current as any).reportValidity();

        }
    }, [customerror]);

    useEffect(() => {
        (inputRef.current as any).blur(); // field Nazov is preselected on start, because it has error on start
    }, []);

    return (
        <div className="input-wrapper">
            <input
                {...inputProps}
                placeholder=""
                ref={inputRef}
                className={`form-control ${innerClass || ""}`}
                autoComplete="off"
                lang={inputProps.lang || "cs-CZ"}
            />
            {inputProps.placeholder && <span className="floating-label">{inputProps.placeholder}</span>}
        </div>
    );
});