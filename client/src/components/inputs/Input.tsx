import React, {useEffect, useRef} from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    customerror?: string;
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
        <input
            {...props}
            ref={inputRef}
            className="form-control" autoComplete="off"
            lang="cs-CZ"
        />
    );
});