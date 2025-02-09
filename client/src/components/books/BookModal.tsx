import {IAutor, IBook, ILangCode, IUser, ValidationError} from "../../type";
import React, {useCallback, useEffect, useState} from "react";
import {getAutors, getInfoAboutBook, getUsers} from "../../API";
import {toast} from "react-toastify";
import {checkIsbnValidity, formPersonsFullName, validateNumber} from "../../utils/utils";
import {countryCode, langCode} from "../../utils/locale";
//import ChipInput from "material-ui-chip-input";
import {showError} from "../Modal";
import {InputField, MultiselectField} from "../InputFields";
import {cities} from "../../utils/constants";
import {openLoadingBooks} from "../LoadingBooks";

interface BodyProps {
    data: IBook | object;
    onChange: (data: IBook | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedLP?: IBook;
}

interface ButtonsProps {
    saveBook: () => void;
    cleanFields: () => void;
    error?: ValidationError[] | undefined;
}

export const BooksModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
	const [formData, setFormData] = useState(data as any);
	const [autors, setAutors] = useState<IAutor[] | []>();
	const [users, setUsers] = useState<IUser[] | undefined>();
	const [errors, setErrors] = useState<ValidationError[]>([{label: "Názov knihy musí obsahovať aspoň jeden znak!", target: "title"}]);

	useEffect(() => {
		onChange(formData);
	}, [formData]);

	// clear form btn
	useEffect(() => {
		if (!data) return;
		if (Object.keys(data).length === 0 && data.constructor === Object) setFormData(data);
	}, [data]);

	const getBookFromISBN = (isbn: string) => {
		if (!("title" in (formData || {})) && checkIsbnValidity(isbn)) {
			openLoadingBooks(true);
			getInfoAboutBook(isbn)
				.then((response) => {
					setFormData({
						...response.data,
						published: {
							...response.data.published,
							country: countryCode.filter((country: ILangCode) =>
								((response.data as IBook)?.published?.country as unknown as string[])?.includes(country.key))
						},
						language: langCode.filter((lang: ILangCode) => ((response.data as IBook)?.language as unknown as string[])?.includes(lang.key)),
					} as IBook)
				})
				.catch(err => console.error(err))
				.finally(() => openLoadingBooks(false))
		}
	}

	//edit book
	useEffect(() => {
		if (!data) return;

		const toBeModified: IBook = {
			...data,
			autor: formPersonsFullName((data as IBook)?.autor),
			translator: formPersonsFullName((data as IBook)?.translator),
			editor: formPersonsFullName((data as IBook)?.editor),
			ilustrator: formPersonsFullName((data as IBook)?.ilustrator),
			location: {city: cities.find(c => c.value === (data as IBook)?.location?.city)?.showValue},
			published: {
				...(data as IBook).published,
				country: countryCode.filter((country: ILangCode) =>
					((data as IBook)?.published?.country as unknown as string[])?.includes(country.key))
			},
			language: langCode.filter((lang: ILangCode) => ((data as IBook)?.language as unknown as string[])?.includes(lang.key)),
			readBy: formPersonsFullName((data as IBook)?.readBy),
			owner: formPersonsFullName((data as IBook)?.owner),
		} as IBook;

		setFormData(toBeModified);
	}, []);

	useEffect(() => {
		getAutors()
			.then(aut => {
				//constructing fullName for autocomplete
				setAutors(aut.data.autors.map((aut: IAutor) => ({
					...aut,
					fullName: formPersonsFullName(aut) as string,
				})).sort((a: Partial<IAutor>, b: Partial<IAutor>) => a.fullName!.localeCompare(b.fullName!)));
			})
			.catch(err => {
				toast.error("Nepodarilo sa nacitat autorov!");
				console.error("Couldnt fetch autors", err)
			});

		getUsers().then(user => {
			setUsers(user.data.users.map((user: IUser) => ({
				...user,
				fullName: formPersonsFullName(user)
			})).sort((a: any, b: any) => a.fullName!.localeCompare(b.fullName!)));
		}).catch();
	}, [])

	//error handling
	useEffect(() => {
		//if there is no filled field, its disabled
		if (!formData) return;

		//default name error
		let localErrors: ValidationError[] = [];

		//some crazy defining ahead
		let n1, n2, n3, n4, n5, n6;
		n1 = n2 = n3 = n4 = n5 = n6 = {valid: true, label: ""} as ValidationError;

		const [height, width, depth, weight]
            = [formData.dimensions?.height, formData.dimensions?.width, formData.dimensions?.depth, formData.dimensions?.weight];

		if (formData.dimensions || !(Object.keys(formData.dimensions ?? {}).length === 0)) {
			n1 = {valid: validateNumber(height, {mustBePositive: true}), label: "Výška", target: "dimensions.height"};
			n2 = {valid: validateNumber(width, {mustBePositive: true}), label: "Šírka", target: "dimensions.width"};
			n3 = {valid: validateNumber(depth, {mustBePositive: true}), label: "Hrúbka", target: "dimensions.depth"};
			n4 = {valid: validateNumber(weight, {mustBePositive: true}), label: "Hmotnosť", target: "dimensions.weight"};
		}
		n5 = {
			valid: validateNumber(formData.numberOfPages, {mustBeInteger: true, mustBePositive: true}),
			label: "Počet strán",
			target: "numberOfPages"
		};
		if (formData.published || !(Object.keys(formData.published ?? {}).length === 0))
			n6 = {
				valid: validateNumber(formData.published?.year, {mustBeInteger: true, mustBePositive: true}),
				label: "Rok vydania",
				target: "published.year"
			};

		const numberValidations = [n1, n2, n3, n4, n5, n6];

		if (!("title" in formData && formData?.title.trim().length > 0)) {
			localErrors.push({label: "Názov knihy musí obsahovať aspoň jeden znak!", target: "title"});
		} else {
			localErrors = localErrors?.filter((err: ValidationError) => err.target !== "title") ?? localErrors;
		}

		if ("ISBN" in formData && !checkIsbnValidity(formData?.ISBN)) {
			localErrors.push({label: "Nevalidné ISBN!", target: "ISBN"});
		} else {
			localErrors = localErrors?.filter((err: ValidationError) => err.target !== "ISBN") ?? localErrors;
		}

		if (!(numberValidations.every(n => n?.valid))) {
			numberValidations.filter(n => !(n?.valid))
				.map((numErr: ValidationError) => {
					return {
						label: numErr.label + " musí byť číslo!",
						target: numErr.target || ""
					}
				})
				.forEach(err => localErrors.push(err))
		} else {
			localErrors = localErrors?.filter((err: ValidationError) => !err.label.includes(" musí byť číslo!")) ?? localErrors;
		}

		setErrors(localErrors);
		error(localErrors);
	}, [formData])

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

	return (<form>
		<div className="container">
			<div className="Nazov">
				<InputField
					value={formData?.title || ""}
					placeholder='*Názov'
					name="title"
					onChange={handleInputChange}
					customerror={getErrorMsg("title")}
				/>
			</div>
			<div className="Podnazov">
				<InputField
					value={formData?.subtitle || ""}
					placeholder='Podnázov'
					name="subtitle"
					onChange={handleInputChange}
				/>
			</div>
			<div className="Autor">
				<MultiselectField
					options={autors}
					displayValue="fullName"
					label="Autor"
					value={formData?.autor}
					name="autor"
					onChange={handleInputChange}
					emptyRecordMsg="Žiadny autor nenájdený"
				/>
			</div>
			<div className="ISBN">
				<InputField
					value={formData?.ISBN || ""}
					placeholder='ISBN'
					name="ISBN"
					onChange={(input) => {
						handleInputChange(input);
						getBookFromISBN(input.target.value);
					}}
					customerror={getErrorMsg("ISBN")}
				/>
			</div>
			<div className="Translator">
				<MultiselectField
					options={autors}
					displayValue="fullName"
					label="Prekladateľ"
					value={formData?.translator}
					name="translator"
					onChange={handleInputChange}
					emptyRecordMsg="Žiadny autor nenájdený"
				/>
			</div>
			<div className="Editor">
				<MultiselectField
					options={autors}
					displayValue="fullName"
					label="Editor"
					value={formData?.editor}
					name="editor"
					onChange={handleInputChange}
					emptyRecordMsg="Žiadny autor nenájdený"
				/>
			</div>
			<div className="Ilustrator">
				<MultiselectField
					options={autors}
					displayValue="fullName"
					label="Ilustrátor"
					value={formData?.ilustrator}
					name="ilustrator"
					onChange={handleInputChange}
					emptyRecordMsg="Žiadny autor nenájdený"
				/>
			</div>
			<div className="Name">
				<InputField
					value={formData?.edition?.title || ""}
					placeholder='Názov edície'
					name="edition.title"
					onChange={handleInputChange}
				/>
			</div>
			<div className="No">
				<InputField
					value={formData?.edition?.no || ""}
					placeholder='Číslo edície'
					name="edition.no"
					onChange={handleInputChange}
				/>
			</div>
			<div className="NameS">
				<InputField
					value={formData?.serie?.title || ""}
					placeholder='Názov série'
					name="serie.title"
					onChange={handleInputChange}
				/>
			</div>
			<div className="NoS">
				<InputField
					value={formData?.serie?.no || ""}
					placeholder='Číslo série'
					name="serie.no"
					onChange={handleInputChange}
				/>
			</div>
			<div className="Vydavatel">
				<InputField
					value={formData?.published?.publisher || ""}
					placeholder='Vydavateľ'
					name="published.publisher"
					onChange={handleInputChange}
				/>
			</div>
			<div className="Rok">
				<InputField
					value={formData?.published?.year || ""}
					placeholder='Rok vydania'
					name="published.year"
					onChange={handleInputChange}
					customerror={getErrorMsg("published.year")}
				/>
			</div>
			<div className="Krajina">
				<MultiselectField
					selectionLimit={1}
					options={countryCode}
					displayValue="value"
					label="Krajina vydania"
					value={formData?.published?.country}
					name="published.country"
					onChange={handleInputChange}
				/>
			</div>

			<div className="Mesto">
				<MultiselectField
					options={cities}
					displayValue="showValue"
					label="Mesto"
					value={formData?.location?.city}
					name="location.city"
					onChange={handleInputChange}
				/>
			</div>
			<div className="Police">
				<InputField
					value={formData?.location?.shelf || ""}
					placeholder='Polica'
					name="location.shelf"
					onChange={handleInputChange}
				/>
			</div>
			<div className="language">
				<MultiselectField
					options={langCode}
					displayValue="value"
					label="Jazyk"
					value={formData?.language}
					name="language"
					onChange={handleInputChange}
				/>
			</div>

			<div className="Vyska">
				<InputField
					value={formData?.dimensions?.height || ""}
					placeholder='Výška (cm)'
					name="dimensions.height"
					onChange={handleInputChange}
					customerror={getErrorMsg("dimensions.height")}
				/>
			</div>
			<div className="Sirka">
				<InputField
					value={formData?.dimensions?.width || ""}
					placeholder='Šírka (cm)'
					name="dimensions.width"
					onChange={handleInputChange}
					customerror={getErrorMsg("dimensions.width")}
				/>
			</div>
			<div className="Hrubka">
				<InputField
					value={formData?.dimensions?.depth || ""}
					placeholder='Hrúbka (cm)'
					name="dimensions.depth"
					onChange={handleInputChange}
					customerror={getErrorMsg("dimensions.depth")}
				/>
			</div>
			<div className="Hmotnost">
				<InputField
					value={formData?.dimensions?.weight || ""}
					placeholder='Hmotnosť (g)'
					name="dimensions.weight"
					onChange={handleInputChange}
					customerror={getErrorMsg("dimensions.weight")}
				/>
			</div>
			<div className="Page-no">
				<InputField
					value={formData?.numberOfPages || ""}
					placeholder='Počet strán'
					name="numberOfPages"
					onChange={handleInputChange}
					customerror={getErrorMsg("numberOfPages")}
				/>
			</div>
			<div className="Obsah">
				{/*<ChipInput
                    className="form-control-important"
                    disableUnderline
                    placeholder="Obsah"
                    value={formData?.content}
                    defaultValue={formData?.content}
                    onChange={(values) => handleInputChange({name: "content", value: values})}
                />*/}
			</div>
			<div className="Poznamka">
				<textarea id='note' placeholder='Poznámka'
					className="form-control"
					name="note"
					autoComplete="off"
					rows={1}
					value={formData?.note || ""}
					onChange={handleInputChange}
				/>
			</div>
			<div className="Precitane">
				<MultiselectField
					options={users}
					displayValue="fullName"
					label="Prečítané"
					value={formData?.readBy}
					name="readBy"
					onChange={handleInputChange}
				/>
			</div>

			<div className="Vlastnik">
				<MultiselectField
					options={users}
					displayValue="fullName"
					label="Vlastník"
					value={formData?.owner}
					name="owner"
					onChange={handleInputChange}
				/>
			</div>
			<div className="Ex-Libris">
				<label><input type="checkbox"
					id="exLibris"
					className="checkBox"
					value={formData?.exLibris}
					onChange={(e) => handleInputChange({name: "exLibris", value: e.target.checked})}
				/>Ex Libris</label>
			</div>
			<div className="pic">
				<InputField
					value={formData?.picture || ""}
					placeholder='Obrázok'
					name="picture"
					onChange={handleInputChange}
				/>
			</div>
			<div className="DK">
				<InputField
					value={formData?.hrefDatabazeKnih || ""}
					placeholder='URL Databáze knih'
					name="hrefDatabazeKnih"
					onChange={handleInputChange}
				/>
			</div>
			<div className="GR">
				<InputField
					value={formData?.hrefGoodReads || ""}
					placeholder='URL GoodReads'
					name="hrefGoodReads"
					onChange={handleInputChange}
				/>
			</div>
		</div>
	</form>)
}

export const BooksModalButtons: React.FC<ButtonsProps> = ({saveBook, cleanFields, error}) => {
	return (
		<div className="column">
			<div>{showError(error)}</div>

			<div className="buttons">
				<button type="button" className="btn btn-secondary"
					onClick={cleanFields}>Vymazať polia
				</button>
				<button type="submit"
					disabled={Boolean(error?.length)}
					onClick={saveBook}
					className="btn btn-success">Uložiť knihu
				</button>
			</div>
		</div>
	)
}