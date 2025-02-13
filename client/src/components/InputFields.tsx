import React, {useEffect, useRef} from "react";
import {Multiselect} from "multiselect-react-dropdown";

const multiselectStyle = {
	inputField: {marginLeft: "0.5rem"},
	optionContainer: {
		backgroundColor: "transparent",
	},
	chips: {background: "#00ADB5"},
	option: {color: "black"},
	multiselectContainer: {maxWidth: "100%"},
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    customerror?: string;
}

interface MultiselectInputProps extends Omit<InputProps, "onChange"> {
    label: string;
    name: string;
    options: any[] | undefined;
    displayValue: string;
	id?: string;
    emptyRecordMsg?: string;
    selectionLimit?: number;
    onChange: ({name, value}: {name: string, value: string}) => void;
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

export const MultiselectField = React.memo(({
	options,
	value,
	displayValue,
	label,
	onChange,
	name,
	id,
	selectionLimit,
	emptyRecordMsg = "Žiadny záznam nenájdený!",
	customerror,
}: MultiselectInputProps) => {
	useEffect(() => {
		const inputElement: any = document.getElementById(`${id}`);
		if (inputElement) {
			if (customerror) {
				inputElement.style.border = "2px dotted red";
				inputElement.style.borderRadius = "4px";
			} else {
				inputElement.style.border = "none";
			}}

	}, [customerror]);

	return (
		<Multiselect
			id={id}
			options={options}
			isObject={true}
			selectionLimit={selectionLimit}
			displayValue={displayValue}
			closeOnSelect={true}
			placeholder={label}
			closeIcon="cancel"
			emptyRecordMsg={emptyRecordMsg}
			style={multiselectStyle}
			avoidHighlightFirstOption={true}
			selectedValues={value}
			onSelect={(value) => onChange({name: name, value: value})}
			onRemove={(removedList, _) => onChange({name: name, value: removedList})}
		/>
	)
})