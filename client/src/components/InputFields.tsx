import React from "react";
import {Multiselect} from "multiselect-react-dropdown";
import {IBook} from "../type";

const multiselectStyle = {
    inputField: {marginLeft: "0.5rem"},
    optionContainer: {
        backgroundColor: "transparent",
    },
    chips: {background: '#00ADB5'},
    option: {color: 'black'},
    multiselectContainer: {maxWidth: '100%'},
};

interface InputProps {
    label: string;
    value: any;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
}

interface MultiselectInputProps extends Omit<InputProps, 'onChange'> {
    options: any[] | undefined;
    displayValue: string;
    emptyRecordMsg?: string;
    //this is overcomplicated, so it works with on change in
    onChange: ({name, value}: {name: string, value: string}) => void;
}

export const InputField = React.memo(({label, value, name, onChange, type = "text"}: InputProps) => {
    return (
        <input
            type={type} placeholder={label} name={name}
            className="form-control" autoComplete="off"
            value={value}
            onChange={onChange}
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