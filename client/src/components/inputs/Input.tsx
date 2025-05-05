import React, {useEffect, useRef} from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    customerror?: string;
    ref?: React.Ref<HTMLInputElement>;
}

export const InputField = React.memo((props: InputProps) => {
    const inputRef = useRef(null);
    useEffect(() => {
        if (props.customerror) {
            if (inputRef.current) {
                (inputRef.current as any).setCustomValidity(props.customerror);
                (inputRef.current as any).reportValidity();
            }
        } else {
            (inputRef.current as any).setCustomValidity("");
            (inputRef.current as any).reportValidity();

        }
    }, [props.customerror]);

    useEffect(() => {
        (inputRef.current as any).blur(); // field Nazov is preselected on start, because it has error on start
    }, []);

    return (
        <div className="input-wrapper">
            <input
                {...props}
                placeholder=""
                ref={inputRef}
                className="form-control" autoComplete="off"
                lang="cs-CZ"
            />
            {props.placeholder && <span className="floating-label">{props.placeholder}</span>}
        </div>
    );
});