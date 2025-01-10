import React, {useCallback, useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import {countryCode, langCode} from "../../utils/locale";
import {Multiselect} from "multiselect-react-dropdown";
import {IAutor, ILangCode, ILP, ValidationError} from "../../type";
import {getAutors} from "../../API";
import {showError} from "../Modal";
import {formPersonsFullName} from "../../utils/utils";
import {InputField, MultiselectField} from "../InputFields";

interface BodyProps {
    data: ILP | object;
    onChange: (data: ILP | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedLP?: ILP;
}

interface ButtonsProps {
    saveLP: () => void;
    cleanFields: () => void;
    error?: ValidationError[] | undefined;
}

export const LPsModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
	const [formData, setFormData] = useState(data as any);
	const [autors, setAutors] = useState<IAutor[] | []>([]);
	const [errors, setErrors] = useState<ValidationError[]>([{label: "Názov LP musí obsahovať aspoň jeden znak!", target: "title"}]);

	const langRef = useRef(null);
	const countryRef = useRef(null);

	useEffect(() => {
		onChange(formData)
	}, [formData]);

	useEffect(() => {
		if (!data) return;
		if (Object.keys(data).length === 0 && data.constructor === Object) setFormData(data);
	}, [data]);

	//edit LP
	useEffect(() => {
		if (!data) return;

		const toBeModified: ILP = {
			...data,
			autor: formPersonsFullName((data as ILP)?.autor),
			published: {country: countryCode.find((country: ILangCode) => ((data as ILP)?.published?.country as unknown as string[])?.includes(country.key))},
			language: langCode.filter((lang: ILangCode) => ((data as ILP)?.language as unknown as string[])?.includes(lang.key))
		} as ILP;

		setFormData(toBeModified);
	}, []);

	useEffect(() => {
		getAutors()
			.then(aut => {
				//TODO: move to BE
				setAutors(aut.data.autors.map((aut: IAutor) => ({
					...aut,
					fullName: `${aut.lastName}, ${aut.firstName}`
				})).sort((a: Partial<IAutor>, b: Partial<IAutor>) => a.fullName!.localeCompare(b.fullName!)));
			})
			.catch(err => {
				toast.error("Nepodarilo sa nacitat autorov!");
				console.error("Couldnt fetch autors", err)
			});
	}, [formData])

	//error handling
	useEffect(() => {
		//shortcut
		const data = (formData as unknown as ILP);

		//if there is no filled field, its disabled
		if (!data) return;

		let localErrors: ValidationError[] = [];

		if (!(data?.title && data.title.trim().length > 0)) {
			localErrors.push({label: "Názov musí obsahovať aspoň jeden znak!", target: "title"});
		} else {
			localErrors = localErrors?.filter((err: ValidationError) => err.target !== "title") ?? localErrors;
		}

		error(localErrors);
		setErrors(localErrors);
	}, [formData])

	const handleInputChange = useCallback((input: any) => {
		console.log(input);
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

	return (
		<form>
			<div className="row">
				<div className="col">
					<InputField
						value={(formData as ILP)?.title || ""}
						placeholder='*Názov'
						name="title"
						onChange={handleInputChange}
						customerror={getErrorMsg("title")}
					/>
				</div>
				<div className="col">
					<InputField
						value={(formData as ILP)?.subtitle || ""}
						placeholder='Podnázov'
						name="subtitle"
						onChange={handleInputChange}
					/>
				</div>
			</div>
			<div style={{height: "5px", width: "100%"}}/>
			<div className="row">
				<div className="col">
					<MultiselectField
						options={autors}
						displayValue="fullName"
						label="Autor"
						value={formData?.autor}
						name="autor"
						onChange={handleInputChange}
						emptyRecordMsg="Žiadny autori nenájdení"
					/>
				</div>
			</div>
			<div style={{height: "5px", width: "100%"}}/>
			<div className="row">
				<div className="col">
					<InputField
						value={(formData as ILP)?.edition?.title || ""}
						placeholder='Názov edície'
						name="edition.title"
						onChange={handleInputChange}
					/>
				</div>
				<div className="col">
					<InputField
						value={(formData as ILP)?.edition?.no || ""}
						placeholder='Číslo edice'
						name="edition.no"
						onChange={handleInputChange}
					/>
				</div>
			</div>
			<div style={{height: "5px", width: "100%"}}/>
			<div className="row">
				<div className="col">
					<InputField
						value={(formData as ILP)?.speed || ""}
						placeholder='Počet otáčok'
						name="speed"
						onChange={handleInputChange}
					/>
				</div>
				<div className="col">
					<InputField
						value={(formData as ILP)?.countLp || ""}
						placeholder='Počet platní'
						name="subtitle"
						onChange={handleInputChange}
					/>
				</div>
			</div>
			<div style={{height: "5px", width: "100%"}}/>
			<div className="row">
				<div className="col">
					<InputField
						value={(formData as ILP)?.published?.year || ""}
						placeholder='Rok vydania'
						name='published.year'
						onChange={handleInputChange}
					/>
				</div>
				<div className="col">
					<Multiselect
						options={countryCode}
						displayValue="value"
						placeholder="Krajina vydania"
						closeIcon="cancel"
						onSelect={(picked: ILangCode[]) => {
							setFormData({
								...formData,
								"published.country": picked.map(v => v.key)
							})
						}}
						style={{
							inputField: {marginLeft: "0.5rem"},
							searchBox: {
								width: "100%",
								paddingRight: "5px",
								marginRight: "-5px",
								borderRadius: "3px"
							}
						}}
						ref={countryRef}
					/>
				</div>
			</div>
			<div style={{height: "5px", width: "100%"}}/>
			<div className="row">
				<div className="col">
					<InputField
						value={(formData as ILP)?.published?.publisher || ""}
						placeholder='Vydavateľ'
						name='published.publisher'
						onChange={handleInputChange}
					/>
				</div>
				<div className="col">
					<Multiselect
						options={langCode}
						displayValue="value"
						placeholder="Jazyk"
						closeIcon="cancel"
						onSelect={(picked: ILangCode[]) => {
							setFormData({...formData, language: picked.map(v => v.key)})
						}}
						style={{
							inputField: {marginLeft: "0.5rem"},
							searchBox: {
								width: "100%",
								paddingRight: "5px",
								marginRight: "-5px",
								borderRadius: "3px"
							}
						}}
						ref={langRef}
					/>
				</div>
			</div>
		</form>
	);
}

export const LPsModalButtons: React.FC<ButtonsProps> = ({saveLP, cleanFields, error}: ButtonsProps) => {
	return (
		<div className="column">
			<div>{showError(error)}</div>

			<div className="buttons">
				<button type="button" className="btn btn-secondary"
					onClick={cleanFields}>Vymazať polia
				</button>
				<button type="submit"
					disabled={Boolean(error)}
					onClick={saveLP}
					className="btn btn-success">Uložiť LP
				</button>
			</div>
		</div>
	)
}