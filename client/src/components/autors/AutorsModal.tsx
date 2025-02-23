import React, {useCallback, useEffect, useState} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {countryCode} from "../../utils/locale";
import {IAutor, ValidationError} from "../../type";
import {InputField, MultiselectField} from "../InputFields";
import {showError} from "../Modal";
import {autorRoles} from "../../utils/constants";

interface BodyProps {
    data: IAutor | object;
    onChange: (data: IAutor | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedAutor?: IAutor;
}

interface ButtonsProps {
    saveAutor: () => void;
    cleanFields: () => void;
    error?: ValidationError[] | undefined;
}

export const AutorsModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
	const [formData, setFormData] = useState(data as any);
	const [errors, setErrors] = useState<ValidationError[]>(
		[{label: "Priezvisko autora musí obsahovať aspoň jeden znak!", target: "lastName"}]);
	const [roleOptions, setRoleOptions] = useState(autorRoles);

	useEffect(() => {
		onChange(formData)
	}, [formData]);

	// clear form btn
	useEffect(() => {
		if (!data) return;
		if (Object.keys(data).length === 0 && data.constructor === Object) setFormData(data);
		setRoleOptions(roleOptions);
	}, [data]);

	//edit autor
	useEffect(() => {
		if (!data) return;

		const toBeModified: IAutor = {
			...data,
			role: autorRoles.filter(obj => ((formData as IAutor).role as string[]).includes(obj.value)),
			dateOfBirth: (formData as IAutor)?.dateOfBirth ?
				new Date((formData as IAutor)?.dateOfBirth as string | number | Date) :
				undefined,
			dateOfDeath: (formData as IAutor)?.dateOfDeath ?
				new Date((formData as IAutor)?.dateOfDeath as string | number | Date) :
				undefined
		} as IAutor;

		setFormData(toBeModified);
	}, []);

	// error handling
	useEffect(() => {
		//shortcut
		const data = (formData as unknown as IAutor);

		//if there is no filled field, its disabled
		if (!data) return;

		let localErrors: ValidationError[] = [];

		//if length is over 0, its OK
		const autorLength = data.lastName?.trim().length > 0;
		if (!autorLength) {
			localErrors.push({label: "Priezvisko autora musí obsahovať aspoň jeden znak!", target: "firstName"});
		} else {
			localErrors = localErrors?.filter((err: ValidationError) => err.target !== "firstName") ?? localErrors;
		}

		if (data.dateOfBirth && data.dateOfDeath) {
			//if dateOfBirth is sooner, its OK
			const dates = data.dateOfBirth! < data.dateOfDeath!;

			if (!dates) {
				localErrors.push({label: "Dátum smrti nemôže byť skôr, než dátum narodenia!", target: "dateOfDeath"});
			} else {
				localErrors = localErrors?.filter((err: ValidationError) => err.target !== "dateOfDeath") ?? localErrors;
			}
		}

		setErrors(localErrors);
		error(localErrors);
	}, [formData]);

	const handleInputChange = useCallback((input: any) => {
		let name: string, value: string;

		if ("target" in input) { // if it is a regular event
			const {name: targetName, value: targetValue} = input.target;
			name = targetName;
			value = targetValue;
		} else { // if it is MultiSelect custom answer
			name = input.name;
			value = input.value;
		}

		setFormData((prevData: any) => {
			// Helper function to create a nested object structure
			const setNestedValue = (obj: any, keys: string[], value: any) => {
				const key = keys.shift(); // Get the first key
				if (!key) return value; // If no more keys, return the value
				obj[key] = setNestedValue(obj[key] || {}, keys, value); // Recursively set the nested value
				return obj;
			};

			const keys = name.split("."); // Split name into keys
			const updatedData = {...prevData}; // Clone previous data
			setNestedValue(updatedData, keys, value); // Set nested value

			return updatedData;
		});
	}, []);

	const getErrorMsg = (name: string): string => {
		return errors.find(err => err.target === name)?.label || "";
	}

	const isValidDate = (varToCheck: unknown) => {
		return varToCheck instanceof Date && !isNaN(varToCheck.valueOf());
	}

	return (
		<form>
			<div className="row">
				<div className="col">
					<InputField
						value={formData?.firstName || ""}
						placeholder='Krstné meno'
						name="firstName"
						onChange={handleInputChange}
					/>
				</div>
				<div className="col">
					<InputField
						value={formData?.lastName || ""}
						placeholder='*Priezvisko'
						name="lastName"
						onChange={handleInputChange}
						customerror={getErrorMsg("lastName")}
					/>
				</div>
			</div>

			<div style={{height: "5px", width: "100%"}}/>

			<div className="row">
				<div className="col">
					<DatePicker
						className="form-control"
						id='dateOfBirth'
						selected={
							(formData as IAutor)?.dateOfBirth ?
								new Date((formData as IAutor)?.dateOfBirth as string | number | Date) :
								undefined
						}
						onChange={(dateOfBirth: any) => setFormData({
							...formData,
							dateOfBirth
						})}
						onSelect={(dateOfBirth: any) => setFormData({
							...formData,
							dateOfBirth
						})}
						locale="cs"
						dateFormat='dd.MM.yyyy'
						placeholderText={"Dátum narodenia"}
						maxDate={new Date()}
					/>
					{isValidDate(formData && "dateOfBirth" in formData ? formData?.dateOfBirth : false) ?
						<button className='clearInput' type="button" onClick={() => {
							setFormData({...formData, dateOfBirth: undefined})
						}}>&#10006;
						</button> : <></>}
				</div>
				<div className="col">
					<DatePicker
						className="form-control"
						id='dateOfDeath'
						selected={
							(formData as IAutor)?.dateOfDeath ?
								new Date((formData as IAutor)?.dateOfDeath as string | number | Date) :
								undefined}
						onChange={(dateOfDeath: any) => setFormData({
							...formData,
							dateOfDeath
						})}
						onSelect={(dateOfDeath: any) => setFormData({
							...formData,
							dateOfDeath
						})}
						locale="cs"
						dateFormat='dd.MM.yyyy'
						placeholderText={"Dátum smrti"}
						maxDate={new Date()}
					/>
					{isValidDate(formData && "dateOfDeath" in formData ? formData?.dateOfDeath : false) ?
						<button className='clearInput' type="button" onClick={() => {
							setFormData({...formData, dateOfDeath: undefined})
						}}>&#10006;
						</button> : <></>}
				</div>
			</div>

			<div style={{height: "5px", width: "100%"}}/>

			<div className="row">
				<div className="col">
					<MultiselectField
						selectionLimit={1}
						options={countryCode}
						displayValue="value"
						label="Národnosť"
						value={formData?.nationality}
						name="nationality"
						onChange={handleInputChange}
					/>
				</div>
				<div className="col">
					<textarea id='note' placeholder='Poznámka'
							  className="form-control"
							  name="note"
							  autoComplete="off"
							  rows={1}
							  value={formData?.note || ""}
							  onChange={handleInputChange}
					/>
				</div>
			</div>

			<div style={{height: "5px", width: "100%"}}/>

			<div className="row">
				<div className="col">
					<MultiselectField
						options={roleOptions}
						displayValue="showValue"
						label="Role"
						value={formData?.role}
						name="role"
						onChange={handleInputChange}
					/>
				</div>
			</div>
		</form>
	)
}

export const AutorsModalButtons = ({saveAutor, cleanFields, error}: ButtonsProps) => {
	return (
		<div className="column">
			<div>{showError(error)}</div>

			<div className="buttons">
				<button type="button" className="btn btn-secondary"
						onClick={cleanFields}>Vymazať polia
				</button>
				<button type="submit"
						disabled={Boolean(error?.length)}
						onClick={saveAutor}
						className="btn btn-success">Uložiť autora
				</button>
			</div>
		</div>
	)
}