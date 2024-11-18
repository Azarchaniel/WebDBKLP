import React, {useEffect, useRef} from "react";
import {Multiselect} from "multiselect-react-dropdown";

const multiselectStyle = {
    inputField: {marginLeft: "0.5rem"},
    optionContainer: {
        backgroundColor: "transparent",
    },
    chips: {background: '#00ADB5'},
    option: {color: 'black'},
    multiselectContainer: {maxWidth: '100%'},
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    customerror?: string;
}

interface MultiselectInputProps extends Omit<InputProps, 'onChange'> {
    label: string;
    name: string;
    options: any[] | undefined;
    displayValue: string;
    emptyRecordMsg?: string;
    onChange: ({name, value}: {name: string, value: string}) => void;
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
        />
    );
});

export const MultiselectField = React.memo(({
                                                options,
                                                value,
                                                displayValue,
                                                label,
                                                onChange,
                                                name,
                                                emptyRecordMsg = "Žiadny záznam nenájdený!"
                                            }: MultiselectInputProps) => {
    return (
        <Multiselect
            options={options}
            isObject={true}
            displayValue={displayValue}
            closeOnSelect={true}
            placeholder={label}
            closeIcon="cancel"
            emptyRecordMsg={emptyRecordMsg}
            style={multiselectStyle}
            avoidHighlightFirstOption={true}
            selectedValues={value}
            onSelect={(value) => onChange({name: name, value: value})}
        />
    )
})